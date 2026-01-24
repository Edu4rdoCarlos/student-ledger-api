import { Test, TestingModule } from '@nestjs/testing';
import { ValidateDocumentUseCase } from './validate-document.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { HashUtil } from '../../infra/utils/hash.util';
import { FabricService } from '../../../fabric/fabric.service';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { Document, DocumentStatus } from '../../domain/entities';
import { ICurrentUser } from '../../../../shared/types';
import { UserRole } from '../../../../shared/enums';

describe('ValidateDocumentUseCase', () => {
  let useCase: ValidateDocumentUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let defenseRepository: jest.Mocked<IDefenseRepository>;
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

  const mockBlockchainDocument = {
    documentId: 'doc-fabric-123',
    minutesHash: mockHash,
    minutesCid: mockCid,
    evaluationHash: 'evaluation-hash-456',
    evaluationCid: 'bafyEvaluationCid789',
    matriculas: ['20201234'],
    defenseDate: '2024-12-01',
    notaFinal: 9.5,
    resultado: 'APPROVED' as const,
    versao: 1,
    motivo: '',
    registeredBy: 'coord@example.com',
    status: 'APPROVED' as const,
    signatures: [
      {
        role: 'coordenador' as const,
        email: 'coord@example.com',
        mspId: 'CoordMSP',
        signature: 'base64signature',
        timestamp: '2024-12-01T10:00:00Z',
        status: 'APPROVED' as const,
      },
    ],
    validatedAt: '2024-12-01T10:00:00Z',
  };

  beforeEach(async () => {
    const mockDocumentRepository = {
      findByCid: jest.fn(),
    };

    const mockDefenseRepository = {
      findById: jest.fn(),
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
          provide: DEFENSE_REPOSITORY,
          useValue: mockDefenseRepository,
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
    defenseRepository = module.get(DEFENSE_REPOSITORY);
    hashUtil = module.get(HashUtil);
    fabricService = module.get(FabricService);
    ipfsService = module.get(IpfsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar erro quando não for fornecido um Buffer', async () => {
      const result = await useCase.execute('not-a-buffer' as any, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Para validar a autenticidade, é necessário fornecer o arquivo PDF original.');
      expect(fabricService.verifyDocument).not.toHaveBeenCalled();
    });

    it('deve validar documento diretamente na blockchain', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: true,
        reason: 'Document found',
        document: mockBlockchainDocument,
      });
      documentRepository.findByCid.mockResolvedValue(null);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(hashUtil.calculateSha256).toHaveBeenCalledWith(mockFileBuffer);
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
      expect(result.document?.blockchainData).toBeDefined();
      expect(result.document?.blockchainData?.matriculas).toEqual(['20201234']);
      expect(result.document?.blockchainData?.signatures).toHaveLength(1);
      expect(result.message).toBe('Documento válido e registrado na blockchain');
    });

    it('deve incluir informações da defesa quando documento local existir', async () => {
      const mockLocalDocument = Document.create({
        minutesHash: mockHash,
        minutesCid: mockCid,
        evaluationHash: 'evaluation-hash-456',
        evaluationCid: 'bafyEvaluationCid789',
        defenseId: 'defense-123',
        status: DocumentStatus.APPROVED,
      });

      const mockDefense = {
        id: 'defense-123',
        students: [{ name: 'João Silva', course: { name: 'Ciência da Computação' } }],
        advisor: { name: 'Prof. Maria' },
      };

      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: true,
        reason: 'Document found',
        document: mockBlockchainDocument,
      });
      documentRepository.findByCid.mockResolvedValue(mockLocalDocument);
      defenseRepository.findById.mockResolvedValue(mockDefense as any);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(true);
      expect(result.document?.defenseInfo).toBeDefined();
      expect(result.document?.defenseInfo?.students).toEqual(['João Silva']);
      expect(result.document?.defenseInfo?.advisor).toBe('Prof. Maria');
      expect(result.document?.defenseInfo?.course).toBe('Ciência da Computação');
    });

    it('deve retornar inválido quando documento não for encontrado na blockchain', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: false,
        reason: 'Document not found in blockchain',
        document: null,
      });

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Document not found in blockchain');
    });

    it('deve retornar mensagem padrão quando blockchain retornar inválido sem razão', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: false,
        reason: '',
        document: null,
      });

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Documento não encontrado na blockchain');
    });

    it('deve tratar erro de conexão com a blockchain graciosamente', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockRejectedValue(new Error('Fabric connection failed'));

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Não foi possível verificar o documento na blockchain. Tente novamente mais tarde.');
    });

    it('deve retornar dados completos da blockchain na resposta', async () => {
      hashUtil.calculateSha256.mockReturnValue(mockHash);
      ipfsService.calculateCid.mockResolvedValue(mockCid);
      fabricService.verifyDocument.mockResolvedValue({
        valid: true,
        reason: 'Document found',
        document: mockBlockchainDocument,
      });
      documentRepository.findByCid.mockResolvedValue(null);

      const result = await useCase.execute(mockFileBuffer, mockUser);

      expect(result.isValid).toBe(true);
      expect(result.document?.blockchainData).toEqual({
        matriculas: ['20201234'],
        defenseDate: '2024-12-01',
        notaFinal: 9.5,
        resultado: 'APPROVED',
        versao: 1,
        signatures: mockBlockchainDocument.signatures,
        validatedAt: '2024-12-01T10:00:00Z',
      });
    });
  });
});
