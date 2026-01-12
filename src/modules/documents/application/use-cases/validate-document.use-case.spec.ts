import { Test, TestingModule } from '@nestjs/testing';
import { ValidateDocumentUseCase } from './validate-document.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { HashUtil } from '../../infra/utils/hash.util';
import { FabricService } from '../../../fabric/fabric.service';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { Document, DocumentStatus } from '../../domain/entities';
import { ICurrentUser } from '../../../../shared/types';
import { UserRole } from '../../../../shared/enums';

describe('ValidateDocumentUseCase', () => {
  let useCase: ValidateDocumentUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let hashUtil: jest.Mocked<HashUtil>;
  let fabricService: jest.Mocked<FabricService>;
  let ipfsService: jest.Mocked<IpfsService>;

  const mockUser: ICurrentUser = {
    id: 'user-123',
    email: 'user@example.com',
    role: UserRole.COORDINATOR,
  };

  const mockFileBuffer = Buffer.from('fake pdf content');
  const mockHash = 'abc123hash';
  const mockCid = 'QmExample123';

  beforeEach(async () => {
    const mockDocumentRepository = {
      findByHash: jest.fn(),
    };

    const mockHashUtil = {
      calculateSha256: jest.fn(),
    };

    const mockFabricService = {
      verifyDocument: jest.fn(),
    };

    const mockIpfsService = {
      calculateCid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateDocumentUseCase,
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockDocumentRepository,
        },
        {
          provide: HashUtil,
          useValue: mockHashUtil,
        },
        {
          provide: FabricService,
          useValue: mockFabricService,
        },
        {
          provide: IpfsService,
          useValue: mockIpfsService,
        },
      ],
    }).compile();

    useCase = module.get<ValidateDocumentUseCase>(ValidateDocumentUseCase);
    documentRepository = module.get(DOCUMENT_REPOSITORY);
    hashUtil = module.get(HashUtil);
    fabricService = module.get(FabricService);
    ipfsService = module.get(IpfsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve validar documento aprovado encontrado no Postgres', async () => {
      const mockDocument = Document.create({
        type: ATA,
        documentHash: mockHash,
        documentCid: mockCid,
        defenseId: 'defense-123',
        status: DocumentStatus.APPROVED,
      });

      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(mockDocument);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(hashUtil.calculateSha256).toHaveBeenCalledWith(mockFileBuffer);
      expect(documentRepository.findByHash).toHaveBeenCalledWith(mockHash);
      expect(result.isValid).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.message).toBe('Documento válido e registrado na blockchain');
      expect(fabricService.verifyDocument).not.toHaveBeenCalled();
    });

    it('deve retornar inválido para documento pendente', async () => {
      const mockDocument = Document.create({
        type: ATA,
        documentHash: mockHash,
        defenseId: 'defense-123',
        status: DocumentStatus.PENDING,
      });

      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(mockDocument);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Documento ainda não foi aprovado');
    });

    it('deve retornar inválido para documento inativo', async () => {
      const mockDocument = Document.create({
        type: ATA,
        documentHash: mockHash,
        defenseId: 'defense-123',
        status: DocumentStatus.INACTIVE,
      });
      mockDocument.inactivate('Nova versão criada');

      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(mockDocument);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Documento foi inativado');
    });

    it('deve consultar Fabric quando documento não for encontrado no Postgres', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(null);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: true,
        reason: 'Document found',
        document: {
          documentId: 'doc-fabric-123',
          ipfsCid: mockCid,
          matricula: '20201234',
          defenseDate: '2024-12-01',
          notaFinal: 9.5,
          resultado: 'APPROVED',
          versao: 1,
          motivo: '',
          registeredBy: 'coord@example.com',
          status: 'APPROVED',
          signatures: [],
          validatedAt: '2024-12-01T10:00:00Z',
        },
      });

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(documentRepository.findByHash).toHaveBeenCalledWith(mockHash);
      expect(ipfsService.calculateCid).toHaveBeenCalledWith(mockFileBuffer);
      expect(fabricService.verifyDocument).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
        mockCid
      );
      expect(result.isValid).toBe(true);
      expect(result.document?.id).toBe('doc-fabric-123');
      expect(result.message).toBe('Documento válido e registrado na blockchain');
    });

    it('deve retornar inválido quando Fabric não encontrar documento', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(null);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: false,
        reason: 'Document not found',
        document: null,
      });

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Documento não encontrado no sistema');
    });

    it('deve fazer fallback para Fabric quando Postgres falhar', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockRejectedValue(new Error('Database connection failed'));
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: true,
        reason: 'Document found',
        document: {
          documentId: 'doc-fabric-123',
          ipfsCid: mockCid,
          matricula: '20201234',
          defenseDate: '2024-12-01',
          notaFinal: 9.5,
          resultado: 'APPROVED',
          versao: 1,
          motivo: '',
          registeredBy: 'coord@example.com',
          status: 'APPROVED',
          signatures: [],
          validatedAt: '2024-12-01T10:00:00Z',
        },
      });

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(documentRepository.findByHash).toHaveBeenCalledWith(mockHash);
      expect(fabricService.verifyDocument).toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    it('deve retornar inválido quando Fabric também falhar', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      documentRepository.findByHash.mockResolvedValue(null);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockRejectedValue(new Error('Fabric connection failed'));

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Documento não encontrado no sistema');
    });
  });
});
