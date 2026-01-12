import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateDocumentVersionUseCase } from './create-document-version.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { HashUtil } from '../../infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { Document, DocumentStatus } from '../../domain/entities';
import { Defense } from '../../../defenses/domain/entities/defense.entity';
import { DocumentNotFoundError } from '../../domain/errors';

describe('CreateDocumentVersionUseCase', () => {
  let useCase: CreateDocumentVersionUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let defenseRepository: jest.Mocked<IDefenseRepository>;
  let hashUtil: jest.Mocked<HashUtil>;
  let ipfsService: jest.Mocked<IpfsService>;
  let createApprovalsUseCase: jest.Mocked<CreateApprovalsUseCase>;

  const mockDocumentFile = Buffer.from('fake pdf content v2');
  const mockOriginalHash = 'original-hash-123';
  const mockNewHash = 'new-hash-456';
  const mockNewCid = 'QmNewCid456';

  beforeEach(async () => {
    const mockDocumentRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockDefenseRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockHashUtil = {
      calculateSha256: jest.fn(),
    };

    const mockIpfsService = {
      uploadFile: jest.fn(),
    };

    const mockCreateApprovalsUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDocumentVersionUseCase,
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
          provide: IpfsService,
          useValue: mockIpfsService,
        },
        {
          provide: CreateApprovalsUseCase,
          useValue: mockCreateApprovalsUseCase,
        },
      ],
    }).compile();

    useCase = module.get<CreateDocumentVersionUseCase>(CreateDocumentVersionUseCase);
    documentRepository = module.get(DOCUMENT_REPOSITORY);
    defenseRepository = module.get(DEFENSE_REPOSITORY);
    hashUtil = module.get(HashUtil);
    ipfsService = module.get(IpfsService);
    createApprovalsUseCase = module.get(CreateApprovalsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar nova versão com sucesso', async () => {
      const mockCurrentDocument = Document.create(
        {
          type: ATA,
          defenseId: 'defense-456',
          version: 1,
          documentHash: mockOriginalHash,
          documentCid: 'QmOldCid123',
          status: DocumentStatus.APPROVED,
          blockchainTxId: 'tx-blockchain-123',
        },
        'doc-123',
      );

      const mockDefense = Defense.create(
        {
          title: 'Defesa de TCC',
          studentIds: ['student-789'],
          advisorId: 'advisor-101',
          defenseDate: new Date('2024-12-01'),
          result: 'APPROVED',
          finalGrade: 8.5,
        },
        'defense-456',
      );

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockNewHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });
      documentRepository.update.mockResolvedValue(mockCurrentDocument);

      const mockNewVersion = Document.create(
        {
          type: ATA,
          defenseId: 'defense-456',
          version: 2,
          documentHash: mockNewHash,
          documentCid: mockNewCid,
          status: DocumentStatus.PENDING,
          previousVersionId: 'doc-123',
          changeReason: 'Correção de nota',
        },
        'doc-new-version',
      );

      documentRepository.create.mockResolvedValue(mockNewVersion);
      defenseRepository.findById.mockResolvedValue(mockDefense);
      defenseRepository.update.mockResolvedValue(mockDefense);
      createApprovalsUseCase.execute.mockResolvedValue({ approvals: [] });

      const result = await useCase.execute({
        documentId: 'doc-123',
        finalGrade: 9.0,
        documentFile: mockDocumentFile,
        documentFilename: 'ata-v2.pdf',
        changeReason: 'Correção de nota',
      });

      expect(documentRepository.findById).toHaveBeenCalledWith('doc-123');
      expect(hashUtil.calculateSha256).toHaveBeenCalledWith(mockDocumentFile);
      expect(ipfsService.uploadFile).toHaveBeenCalledWith(mockDocumentFile, 'ata-v2.pdf');
      expect(documentRepository.update).toHaveBeenCalled();
      expect(documentRepository.create).toHaveBeenCalled();
      expect(defenseRepository.update).toHaveBeenCalled();
      expect(result.previousVersion).toBeDefined();
      expect(result.newVersion).toBeDefined();
      expect(result.newVersion.version).toBe(2);
    });

    it('deve lançar erro se documento não for encontrado', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId: 'doc-inexistente',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow(DocumentNotFoundError);

      expect(documentRepository.findById).toHaveBeenCalledWith('doc-inexistente');
    });

    it('deve lançar erro se documento estiver PENDING', async () => {
      const mockPendingDocument = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        status: DocumentStatus.PENDING,
      });

      documentRepository.findById.mockResolvedValue(mockPendingDocument);

      await expect(
        useCase.execute({
          documentId: 'doc-pending',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow(BadRequestException);

      await expect(
        useCase.execute({
          documentId: 'doc-pending',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Documento PENDING não pode ser versionado');
    });

    it('deve lançar erro se documento estiver INACTIVE', async () => {
      const mockInactiveDocument = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        status: DocumentStatus.INACTIVE,
      });
      mockInactiveDocument.inactivate('Já foi inativado antes');

      documentRepository.findById.mockResolvedValue(mockInactiveDocument);

      await expect(
        useCase.execute({
          documentId: 'doc-inactive',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Documento já está inativo');
    });

    it('deve lançar erro se documento não estiver registrado na blockchain', async () => {
      const mockDocumentWithoutBlockchain = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        status: DocumentStatus.APPROVED,
        documentHash: mockOriginalHash,
        // blockchainTxId não definido
      });

      documentRepository.findById.mockResolvedValue(mockDocumentWithoutBlockchain);

      await expect(
        useCase.execute({
          documentId: 'doc-no-blockchain',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Documento ainda não foi registrado na blockchain');
    });

    it('deve lançar erro se nova versão tiver mesmo conteúdo', async () => {
      const mockCurrentDocument = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        version: 1,
        documentHash: mockOriginalHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockOriginalHash); // mesmo hash

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Nova versão deve ter conteúdo diferente da versão anterior');
    });

    it('deve lançar erro se IPFS retornar queued', async () => {
      const mockCurrentDocument = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        version: 1,
        documentHash: mockOriginalHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockNewHash);
      ipfsService.uploadFile.mockResolvedValue({ queued: true });

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Falha ao fazer upload do arquivo');
    });

    it('deve lançar erro se IPFS falhar', async () => {
      const mockCurrentDocument = Document.create({
        type: ATA,
        defenseId: 'defense-456',
        version: 1,
        documentHash: mockOriginalHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockNewHash);
      ipfsService.uploadFile.mockRejectedValue(new Error('IPFS connection failed'));

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Falha ao fazer upload do arquivo');
    });

    it('deve lançar erro se Defense não for encontrada', async () => {
      const mockCurrentDocument = Document.create(
        {
          type: ATA,
          defenseId: 'defense-inexistente',
          version: 1,
          documentHash: mockOriginalHash,
          status: DocumentStatus.APPROVED,
          blockchainTxId: 'tx-blockchain-123',
        },
        'doc-123',
      );

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockNewHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });
      documentRepository.update.mockResolvedValue(mockCurrentDocument);

      const mockNewVersion = Document.create(
        {
          type: ATA,
          defenseId: 'defense-inexistente',
          version: 2,
          documentHash: mockNewHash,
          documentCid: mockNewCid,
          status: DocumentStatus.PENDING,
        },
        'doc-new-version',
      );

      documentRepository.create.mockResolvedValue(mockNewVersion);
      defenseRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('deve criar aprovações de forma assíncrona sem bloquear execução', async () => {
      const mockCurrentDocument = Document.create(
        {
          type: ATA,
          defenseId: 'defense-456',
          version: 1,
          documentHash: mockOriginalHash,
          status: DocumentStatus.APPROVED,
          blockchainTxId: 'tx-blockchain-123',
        },
        'doc-123',
      );

      const mockDefense = Defense.create(
        {
          title: 'Defesa de TCC',
          studentIds: ['student-789'],
          advisorId: 'advisor-101',
          defenseDate: new Date('2024-12-01'),
          result: 'APPROVED',
          finalGrade: 8.5,
        },
        'defense-456',
      );

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      hashUtil.calculateSha256.mockReturnValue(mockNewHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });
      documentRepository.update.mockResolvedValue(mockCurrentDocument);

      const mockNewVersion = Document.create(
        {
          type: ATA,
          defenseId: 'defense-456',
          version: 2,
          documentHash: mockNewHash,
          documentCid: mockNewCid,
          status: DocumentStatus.PENDING,
        },
        'doc-new-version',
      );

      documentRepository.create.mockResolvedValue(mockNewVersion);
      defenseRepository.findById.mockResolvedValue(mockDefense);
      defenseRepository.update.mockResolvedValue(mockDefense);

      // Simula falha assíncrona em createApprovals - não deve impactar execução
      createApprovalsUseCase.execute.mockRejectedValue(new Error('Falha ao criar aprovações'));

      const result = await useCase.execute({
        documentId: 'doc-123',
        finalGrade: 9.0,
        documentFile: mockDocumentFile,
        documentFilename: 'ata-v2.pdf',
        changeReason: 'Correção de nota',
      });

      // Execução deve ter sucesso mesmo com falha nas aprovações
      expect(result.newVersion).toBeDefined();
      expect(createApprovalsUseCase.execute).toHaveBeenCalledWith({
        documentId: 'doc-new-version',
      });
    });
  });
});
