import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { Document, DocumentType } from '../../domain/entities';
import { HashUtil } from '../../infra/utils/hash.util';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { CreateApprovalsUseCase, ResetApprovalsForNewVersionUseCase } from '../../../approvals/application/use-cases';
import { DocumentNotFoundError } from '../../domain/errors';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../../../approvals/application/ports';
import { ApprovalStatus } from '../../../approvals/domain/entities';
import { FileUploadAdapter } from '../../../../../shared/adapters';

interface CreateDocumentVersionRequest {
  documentId: string;
  documentType: DocumentType;
  finalGrade?: number;
  documentFile: Buffer;
  documentFilename: string;
  changeReason: string;
  coordinatorId: string;
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
    private readonly hashUtil: HashUtil,
    private readonly fileUploadAdapter: FileUploadAdapter,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
    private readonly resetApprovalsUseCase: ResetApprovalsForNewVersionUseCase,
  ) {}

  async execute(request: CreateDocumentVersionRequest): Promise<CreateDocumentVersionResponse> {
    const currentDocument = await this.findDocument(request.documentId);
    const isFullyApproved = await this.checkIfDocumentIsFullyApproved(request.documentId);

    const newDocumentHash = this.calculateAndValidateHash(request.documentFile, currentDocument, request.documentType);
    const uploadResult = await this.fileUploadAdapter.uploadFile(request.documentFile, request.documentFilename);

    const { createdVersion, previousVersion, wasReplaced } = await this.createOrReplaceDocument(
      currentDocument,
      isFullyApproved,
      newDocumentHash,
      uploadResult.cid,
      request.changeReason,
      request.documentType
    );

    if (wasReplaced) {
      await this.resetApprovalsUseCase.execute(createdVersion.id);
    } else {
      await this.createNewApprovals(createdVersion.id, request.coordinatorId);
    }

    await this.updateDefenseGrade(currentDocument.defenseId, request.finalGrade);

    return { previousVersion, newVersion: createdVersion };
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

    const currentHash = documentType === 'minutes'
      ? currentDocument.minutesHash
      : currentDocument.evaluationHash;

    if (currentHash === newDocumentHash) {
      const docTypeLabel = documentType === 'minutes' ? 'Ata' : 'Avaliação de Desempenho';
      throw new BadRequestException(`Nova versão da ${docTypeLabel} deve ter conteúdo diferente da versão anterior`);
    }

    return newDocumentHash;
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

  private async createNewApprovals(documentId: string, coordinatorId: string): Promise<void> {
    this.logger.log(`Criando novas aprovações para documento ${documentId}`);

    this.createApprovalsUseCase.execute({ documentId, coordinatorId }).catch((error) => {
      this.logger.error(`Falha ao criar aprovações: ${error.message}`);
    });
  }

}
