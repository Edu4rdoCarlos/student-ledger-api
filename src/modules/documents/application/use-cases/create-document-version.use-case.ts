import { Injectable, Inject, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { Document } from '../../domain/entities';
import { HashUtil } from '../../infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { DocumentNotFoundError } from '../../domain/errors';
import { IApprovalRepository, APPROVAL_REPOSITORY } from '../../../approvals/application/ports';
import { ApprovalStatus } from '../../../approvals/domain/entities';

interface CreateDocumentVersionRequest {
  documentId: string;
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
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: CreateDocumentVersionRequest): Promise<CreateDocumentVersionResponse> {
    const currentDocument = await this.findDocument(request.documentId);
    const isFullyApproved = await this.checkIfDocumentIsFullyApproved(request.documentId);

    const newDocumentHash = this.calculateAndValidateHash(request.documentFile, currentDocument);
    const newDocumentCid = await this.uploadToIpfs(request.documentFile, request.documentFilename);

    try {
      const { createdVersion, previousVersion } = await this.createOrReplaceDocument(
        currentDocument,
        isFullyApproved,
        newDocumentHash,
        newDocumentCid,
        request.changeReason
      );

      await this.resetApprovals(createdVersion.id);
      await this.updateDefenseGrade(currentDocument.defenseId, request.finalGrade);
      await this.createNewApprovals(createdVersion.id);

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

  private calculateAndValidateHash(documentFile: Buffer, currentDocument: Document): string {
    const newDocumentHash = this.hashUtil.calculateSha256(documentFile);

    if (currentDocument.documentHash === newDocumentHash) {
      throw new BadRequestException('Nova versão deve ter conteúdo diferente da versão anterior');
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
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo. Tente novamente.');
    }
  }

  private async createOrReplaceDocument(
    currentDocument: Document,
    isFullyApproved: boolean,
    newDocumentHash: string,
    newDocumentCid: string,
    changeReason: string
  ): Promise<{ createdVersion: Document; previousVersion: Document }> {
    if (isFullyApproved) {
      return await this.createNewVersion(currentDocument, newDocumentHash, newDocumentCid, changeReason);
    } else {
      return await this.replaceCurrentDocument(currentDocument, newDocumentHash, newDocumentCid);
    }
  }

  private async createNewVersion(
    currentDocument: Document,
    newDocumentHash: string,
    newDocumentCid: string,
    changeReason: string
  ): Promise<{ createdVersion: Document; previousVersion: Document }> {
    this.logger.log(`Criando nova versão do documento ${currentDocument.id}`);

    currentDocument.inactivate(`Nova versão criada: ${changeReason}`);
    await this.documentRepository.update(currentDocument);

    const newVersion = currentDocument.createNewVersion(newDocumentHash, changeReason);
    newVersion.setDocumentCid(newDocumentCid);
    const createdVersion = await this.documentRepository.create(newVersion);

    return { createdVersion, previousVersion: currentDocument };
  }

  private async replaceCurrentDocument(
    currentDocument: Document,
    newDocumentHash: string,
    newDocumentCid: string
  ): Promise<{ createdVersion: Document; previousVersion: Document }> {
    this.logger.log(`Substituindo documento ${currentDocument.id} (mantendo mesma versão)`);

    currentDocument.setDocumentHash(newDocumentHash);
    currentDocument.setDocumentCid(newDocumentCid);
    const updatedDocument = await this.documentRepository.update(currentDocument);

    return { createdVersion: updatedDocument, previousVersion: currentDocument };
  }

  private async resetApprovals(documentId: string): Promise<void> {
    this.logger.log(`Deletando aprovações antigas do documento ${documentId}`);

    const approvalsToDelete = await this.approvalRepository.findByDocumentId(documentId);

    for (const approval of approvalsToDelete) {
      if (approval.id) {
        await this.approvalRepository.delete(approval.id);
      }
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
