import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateDocumentVersionUseCase } from './create-document-version.use-case';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../../../approvals/application/ports';
import { HashUtil } from '../../infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { Document, DocumentStatus } from '../../domain/entities';
import { Defense } from '../../../defenses/domain/entities/defense.entity';
import { DocumentNotFoundError } from '../../domain/errors';
import { ApprovalStatus } from '../../../approvals/domain/entities';

describe('CreateDocumentVersionUseCase', () => {
  let useCase: CreateDocumentVersionUseCase;
  let documentRepository: jest.Mocked<IDocumentRepository>;
  let defenseRepository: jest.Mocked<IDefenseRepository>;
  let approvalRepository: jest.Mocked<IApprovalRepository>;
  let hashUtil: jest.Mocked<HashUtil>;
  let ipfsService: jest.Mocked<IpfsService>;
  let createApprovalsUseCase: jest.Mocked<CreateApprovalsUseCase>;

  const mockDocumentFile = Buffer.from('fake pdf content v2');
  const mockOriginalMinutesHash = 'original-minutes-hash-123';
  const mockNewMinutesHash = 'new-minutes-hash-456';
  const mockNewMinutesCid = 'QmNewMinutesCid456';

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

    const mockApprovalRepository = {
      findByDocumentId: jest.fn(),
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
          provide: APPROVAL_REPOSITORY,
          useValue: mockApprovalRepository,
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
    approvalRepository = module.get(APPROVAL_REPOSITORY);
    hashUtil = module.get(HashUtil);
    ipfsService = module.get(IpfsService);
    createApprovalsUseCase = module.get(CreateApprovalsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar nova versão com sucesso quando documento está totalmente aprovado', async () => {
      const mockCurrentDocument = Document.create(
        {
          defenseId: 'defense-456',
          version: 1,
          minutesHash: mockOriginalMinutesHash,
          minutesCid: 'QmOldMinutesCid123',
          evaluationHash: 'original-evaluation-hash',
          evaluationCid: 'bafyOldEvaluationCid',
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

      const mockApprovals = [
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
        { id: 'approval-2', status: ApprovalStatus.APPROVED },
      ];

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue(mockApprovals as any);
      hashUtil.calculateSha256.mockReturnValue(mockNewMinutesHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewMinutesCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });
      documentRepository.update.mockResolvedValue(mockCurrentDocument);

      const mockNewVersion = Document.create(
        {
          defenseId: 'defense-456',
          version: 2,
          minutesHash: mockNewMinutesHash,
          minutesCid: mockNewMinutesCid,
          evaluationHash: 'original-evaluation-hash',
          evaluationCid: 'bafyOldEvaluationCid',
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
        documentType: 'minutes',
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

    it('deve substituir documento quando não está totalmente aprovado', async () => {
      const mockCurrentDocument = Document.create(
        {
          defenseId: 'defense-456',
          version: 1,
          minutesHash: mockOriginalMinutesHash,
          minutesCid: 'QmOldMinutesCid123',
          status: DocumentStatus.PENDING,
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

      const mockApprovals = [
        { id: 'approval-1', status: ApprovalStatus.PENDING, resetForNewVersion: jest.fn() },
        { id: 'approval-2', status: ApprovalStatus.APPROVED, resetForNewVersion: jest.fn() },
      ];

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue(mockApprovals as any);
      hashUtil.calculateSha256.mockReturnValue(mockNewMinutesHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewMinutesCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });

      const updatedDocument = Document.create(
        {
          defenseId: 'defense-456',
          version: 1,
          minutesHash: mockNewMinutesHash,
          minutesCid: mockNewMinutesCid,
          status: DocumentStatus.PENDING,
        },
        'doc-123',
      );

      documentRepository.update.mockResolvedValue(updatedDocument);
      defenseRepository.findById.mockResolvedValue(mockDefense);
      defenseRepository.update.mockResolvedValue(mockDefense);

      const result = await useCase.execute({
        documentId: 'doc-123',
        documentType: 'minutes',
        finalGrade: 9.0,
        documentFile: mockDocumentFile,
        documentFilename: 'ata-v2.pdf',
        changeReason: 'Correção de nota',
      });

      expect(result.newVersion.version).toBe(1);
      expect(documentRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro se documento não for encontrado', async () => {
      documentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId: 'doc-inexistente',
          documentType: 'minutes',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow(DocumentNotFoundError);

      expect(documentRepository.findById).toHaveBeenCalledWith('doc-inexistente');
    });

    it('deve lançar erro se nova versão da ata tiver mesmo conteúdo', async () => {
      const mockCurrentDocument = Document.create({
        defenseId: 'defense-456',
        version: 1,
        minutesHash: mockOriginalMinutesHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue([
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
      ] as any);
      hashUtil.calculateSha256.mockReturnValue(mockOriginalMinutesHash); // mesmo hash

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          documentType: 'minutes',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Nova versão da Ata deve ter conteúdo diferente da versão anterior');
    });

    it('deve lançar erro se nova versão da avaliação tiver mesmo conteúdo', async () => {
      const mockOriginalEvaluationHash = 'original-evaluation-hash';
      const mockCurrentDocument = Document.create({
        defenseId: 'defense-456',
        version: 1,
        evaluationHash: mockOriginalEvaluationHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue([
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
      ] as any);
      hashUtil.calculateSha256.mockReturnValue(mockOriginalEvaluationHash); // mesmo hash

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          documentType: 'evaluation',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'avaliacao-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Nova versão da Avaliação de Desempenho deve ter conteúdo diferente da versão anterior');
    });

    it('deve lançar erro se IPFS retornar queued', async () => {
      const mockCurrentDocument = Document.create({
        defenseId: 'defense-456',
        version: 1,
        minutesHash: mockOriginalMinutesHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue([
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
      ] as any);
      hashUtil.calculateSha256.mockReturnValue(mockNewMinutesHash);
      ipfsService.uploadFile.mockResolvedValue({ queued: true });

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          documentType: 'minutes',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Sistema de armazenamento temporariamente indisponível');
    });

    it('deve lançar erro se IPFS falhar', async () => {
      const mockCurrentDocument = Document.create({
        defenseId: 'defense-456',
        version: 1,
        minutesHash: mockOriginalMinutesHash,
        status: DocumentStatus.APPROVED,
        blockchainTxId: 'tx-blockchain-123',
      });

      documentRepository.findById.mockResolvedValue(mockCurrentDocument);
      approvalRepository.findByDocumentId.mockResolvedValue([
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
      ] as any);
      hashUtil.calculateSha256.mockReturnValue(mockNewMinutesHash);
      ipfsService.uploadFile.mockRejectedValue(new Error('IPFS connection failed'));

      await expect(
        useCase.execute({
          documentId: 'doc-123',
          documentType: 'minutes',
          finalGrade: 9.0,
          documentFile: mockDocumentFile,
          documentFilename: 'ata-v2.pdf',
          changeReason: 'Correção',
        })
      ).rejects.toThrow('Falha ao fazer upload do arquivo');
    });

    it('deve criar aprovações de forma assíncrona sem bloquear execução', async () => {
      const mockCurrentDocument = Document.create(
        {
          defenseId: 'defense-456',
          version: 1,
          minutesHash: mockOriginalMinutesHash,
          minutesCid: 'QmOldCid123',
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
      approvalRepository.findByDocumentId.mockResolvedValue([
        { id: 'approval-1', status: ApprovalStatus.APPROVED },
      ] as any);
      hashUtil.calculateSha256.mockReturnValue(mockNewMinutesHash);
      ipfsService.uploadFile.mockResolvedValue({
        cid: mockNewMinutesCid,
        name: 'ata-v2.pdf',
        size: 1024,
      });
      documentRepository.update.mockResolvedValue(mockCurrentDocument);

      const mockNewVersion = Document.create(
        {
          defenseId: 'defense-456',
          version: 2,
          minutesHash: mockNewMinutesHash,
          minutesCid: mockNewMinutesCid,
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
        documentType: 'minutes',
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
