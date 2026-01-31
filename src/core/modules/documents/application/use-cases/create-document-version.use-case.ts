import { Injectable, Inject, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { Document, DocumentType } from '../../domain/entities';
import { HashUtil } from '../../infra/utils/hash.util';
import { IpfsService } from '../../../../toolkit/ipfs/ipfs.service';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { DocumentNotFoundError } from '../../domain/errors';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../../../approvals/application/ports';
import { ApprovalRole, ApprovalStatus } from '../../../approvals/domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { CertificateQueueService } from '../../../../toolkit/fabric/application/services/certificate-queue.service';
import { CertificateManagementService } from '../../../../toolkit/fabric/application/services/certificate-management.service';

interface CreateDocumentVersionRequest {
  documentId: string;
  documentType: DocumentType;
  finalGrade?: number;
  documentFile: Buffer;
  documentFilename: string;
  changeReason: string;
}

interface CreateDocumentVersionResponse {
  previousVersion: Document;
  newVersion: Document;
}

@Injectable()
export class CreateDocumentVersionUseCase {
  private readonly logger = new Logger(CreateDocumentVersionUseCase.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepository: IApprovalRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
    private readonly certificateQueue: CertificateQueueService,
    private readonly certificateManagement: CertificateManagementService,
  ) {}

  async execute(request: CreateDocumentVersionRequest): Promise<CreateDocumentVersionResponse> {
    const currentDocument = await this.findDocument(request.documentId);
    const isFullyApproved = await this.checkIfDocumentIsFullyApproved(request.documentId);

    const newDocumentHash = this.calculateAndValidateHash(request.documentFile, currentDocument, request.documentType);
    const newDocumentCid = await this.uploadToIpfs(request.documentFile, request.documentFilename);

    try {
      const { createdVersion, previousVersion, wasReplaced } = await this.createOrReplaceDocument(
        currentDocument,
        isFullyApproved,
        newDocumentHash,
        newDocumentCid,
        request.changeReason,
        request.documentType
      );

      if (wasReplaced) {
        await this.resetApprovalsStatus(createdVersion.id);
      } else {
        await this.createNewApprovals(createdVersion.id);
      }
      await this.updateDefenseGrade(currentDocument.defenseId, request.finalGrade);

      return { previousVersion, newVersion: createdVersion };
    } catch (error) {
      this.logger.error(`Falha ao criar nova versão: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao criar nova versão do documento. Tente novamente.');
    }
  }

  private async findDocument(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      this.logger.error(`Documento não encontrado: ${documentId}`);
      throw new DocumentNotFoundError(`Documento não encontrado: ${documentId}`);
    }
    return document;
  }

  private async checkIfDocumentIsFullyApproved(documentId: string): Promise<boolean> {
    const approvals = await this.approvalRepository.findByDocumentId(documentId);
    const isFullyApproved = approvals.length > 0 && approvals.every(
      approval => approval.status === ApprovalStatus.APPROVED
    );

    this.logger.log(`Documento ${documentId} aprovado por todos: ${isFullyApproved}`);
    return isFullyApproved;
  }

  private calculateAndValidateHash(documentFile: Buffer, currentDocument: Document, documentType: DocumentType): string {
    const newDocumentHash = this.hashUtil.calculateSha256(documentFile);

    // Get the current hash for the specific document type
    const currentHash = documentType === 'minutes'
      ? currentDocument.minutesHash
      : currentDocument.evaluationHash;

    if (currentHash === newDocumentHash) {
      const docTypeLabel = documentType === 'minutes' ? 'Ata' : 'Avaliação de Desempenho';
      throw new BadRequestException(`Nova versão da ${docTypeLabel} deve ter conteúdo diferente da versão anterior`);
    }

    return newDocumentHash;
  }

  private async uploadToIpfs(documentFile: Buffer, documentFilename: string): Promise<string> {
    try {
      const ipfsResult = await this.ipfsService.uploadFile(documentFile, documentFilename);

      if ('queued' in ipfsResult) {
        this.logger.warn('Upload IPFS enfileirado - será processado em breve');
        throw new InternalServerErrorException('Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      return ipfsResult.cid;
    } catch (error) {
      this.logger.error(`Falha ao fazer upload para IPFS: ${error.message}`, error.stack);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo. Tente novamente.');
    }
  }

  private async createOrReplaceDocument(
    currentDocument: Document,
    isFullyApproved: boolean,
    newDocumentHash: string,
    newDocumentCid: string,
    changeReason: string,
    documentType: DocumentType
  ): Promise<{ createdVersion: Document; previousVersion: Document; wasReplaced: boolean }> {
    if (isFullyApproved) {
      const result = await this.createNewVersion(currentDocument, newDocumentHash, newDocumentCid, changeReason, documentType);
      return { ...result, wasReplaced: false };
    } else {
      const result = await this.replaceCurrentDocument(currentDocument, newDocumentHash, newDocumentCid, documentType);
      return { ...result, wasReplaced: true };
    }
  }

  private async createNewVersion(
    currentDocument: Document,
    newDocumentHash: string,
    newDocumentCid: string,
    changeReason: string,
    documentType: DocumentType
  ): Promise<{ createdVersion: Document; previousVersion: Document }> {
    const docTypeLabel = documentType === 'minutes' ? 'Ata' : 'Avaliação de Desempenho';
    this.logger.log(`Criando nova versão do documento ${currentDocument.id} (${docTypeLabel})`);

    currentDocument.inactivate(`Nova versão criada: ${changeReason}`);
    await this.documentRepository.update(currentDocument);

    const newVersion = currentDocument.createNewVersion(documentType, newDocumentHash, changeReason);
    if (documentType === 'minutes') {
      newVersion.setMinutesCid(newDocumentCid);
    } else {
      newVersion.setEvaluationCid(newDocumentCid);
    }
    const createdVersion = await this.documentRepository.create(newVersion);

    return { createdVersion, previousVersion: currentDocument };
  }

  private async replaceCurrentDocument(
    currentDocument: Document,
    newDocumentHash: string,
    newDocumentCid: string,
    documentType: DocumentType
  ): Promise<{ createdVersion: Document; previousVersion: Document }> {
    const docTypeLabel = documentType === 'minutes' ? 'Ata' : 'Avaliação de Desempenho';
    this.logger.log(`Substituindo ${docTypeLabel} do documento ${currentDocument.id} (mantendo mesma versão)`);

    if (documentType === 'minutes') {
      currentDocument.setMinutesHash(newDocumentHash);
      currentDocument.setMinutesCid(newDocumentCid);
    } else {
      currentDocument.setEvaluationHash(newDocumentHash);
      currentDocument.setEvaluationCid(newDocumentCid);
    }
    const updatedDocument = await this.documentRepository.update(currentDocument);

    return { createdVersion: updatedDocument, previousVersion: currentDocument };
  }

  private async resetApprovalsStatus(documentId: string): Promise<void> {
    this.logger.log(`Resetando aprovações do documento ${documentId}`);

    const approvals = await this.approvalRepository.findByDocumentId(documentId);

    for (const approval of approvals) {
      if (approval.id && approval.status !== ApprovalStatus.PENDING) {
        // Revogar certificado antigo e gerar novo
        await this.revokeCertificateAndGenerateNew(approval.id, approval.approverId, approval.role);

        approval.resetForNewVersion();
        await this.approvalRepository.update(approval);
      }
    }
  }

  private async revokeCertificateAndGenerateNew(
    approvalId: string,
    approverId: string | undefined,
    role: ApprovalRole,
  ): Promise<void> {
    if (!approverId) {
      this.logger.warn(`Aprovação ${approvalId} sem approverId, pulando regeneração de certificado`);
      return;
    }

    // COORDINATOR usa certificado base (permanente), não gera por approval
    if (role === ApprovalRole.COORDINATOR) {
      this.logger.log(`Coordenador usa certificado base, não regenerando para approval ${approvalId}`);
      return;
    }

    try {
      // Revogar certificado antigo
      await this.certificateManagement.revokeCertificateByApprovalId(
        approvalId,
        'Documento atualizado - nova versão enviada',
        'system',
      );
    } catch (error) {
      this.logger.warn(`Falha ao revogar certificado para approval ${approvalId}: ${error.message}`);
    }

    // Buscar informações do usuário para gerar novo certificado
    const userInfo = await this.getUserInfoForCertificate(approverId, role);
    if (!userInfo) {
      this.logger.error(`Não foi possível obter informações do usuário ${approverId} para gerar certificado`);
      return;
    }

    // Gerar novo certificado
    this.certificateQueue.enqueueCertificateGeneration(
      approverId,
      userInfo.email,
      userInfo.prismaRole,
      approvalId,
    ).catch(error => {
      this.logger.error(`Falha ao enfileirar novo certificado para approval ${approvalId}: ${error.message}`);
    });
  }

  private async getUserInfoForCertificate(
    userId: string,
    role: ApprovalRole,
  ): Promise<{ email: string; prismaRole: Role } | null> {
    switch (role) {
      case ApprovalRole.STUDENT: {
        const student = await this.studentRepository.findById(userId);
        return student ? { email: student.email, prismaRole: Role.STUDENT } : null;
      }
      case ApprovalRole.ADVISOR: {
        const advisor = await this.advisorRepository.findById(userId);
        return advisor ? { email: advisor.email, prismaRole: Role.ADVISOR } : null;
      }
      case ApprovalRole.COORDINATOR: {
        const coordinator = await this.coordinatorRepository.findById(userId);
        return coordinator ? { email: coordinator.email, prismaRole: Role.COORDINATOR } : null;
      }
      default:
        return null;
    }
  }

  private async updateDefenseGrade(defenseId: string, finalGrade?: number): Promise<void> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      this.logger.error(`Defense não encontrada: ${defenseId}`);
      throw new Error('Defense não encontrada');
    }

    if (finalGrade !== undefined) {
      defense.setGrade(finalGrade);
      await this.defenseRepository.update(defense);
    }
  }

  private async createNewApprovals(documentId: string): Promise<void> {
    this.logger.log(`Criando novas aprovações para documento ${documentId}`);

    this.createApprovalsUseCase.execute({ documentId }).catch((error) => {
      this.logger.error(`Falha ao criar aprovações: ${error.message}`);
    });
  }

}
