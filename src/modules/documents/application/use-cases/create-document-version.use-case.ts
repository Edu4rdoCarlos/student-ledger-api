import { Injectable, Inject, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { Document } from '../../domain/entities';
import { HashUtil } from '../../infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';
import { DocumentNotFoundError } from '../../domain/errors';

interface CreateDocumentVersionRequest {
  documentId: string;
  finalGrade: number;
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
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: CreateDocumentVersionRequest): Promise<CreateDocumentVersionResponse> {
    const currentDocument = await this.documentRepository.findById(request.documentId);
    if (!currentDocument) {
      this.logger.error(`Documento não encontrado: ${request.documentId}`);
      throw new DocumentNotFoundError(`Documento não encontrado: ${request.documentId}`);
    }

    this.validateDocumentCanBeVersioned(currentDocument);

    const newDocumentHash = this.hashUtil.calculateSha256(request.documentFile);

    if (currentDocument.documentHash === newDocumentHash) {
      throw new BadRequestException('Nova versão deve ter conteúdo diferente da versão anterior');
    }

    let newDocumentCid: string;
    try {
      const ipfsResult = await this.ipfsService.uploadFile(
        request.documentFile,
        request.documentFilename
      );

      if ('queued' in ipfsResult) {
        this.logger.warn('Upload IPFS enfileirado - será processado em breve');
        throw new InternalServerErrorException('Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      newDocumentCid = ipfsResult.cid;
    } catch (error) {
      this.logger.error(`Falha ao fazer upload para IPFS: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo. Tente novamente.');
    }

    try {
      currentDocument.inactivate(`Nova versão criada: ${request.changeReason}`);
      await this.documentRepository.update(currentDocument);

      const newVersion = currentDocument.createNewVersion(newDocumentHash, request.changeReason);
      newVersion.setDocumentCid(newDocumentCid);
      const createdVersion = await this.documentRepository.create(newVersion);

      const defense = await this.defenseRepository.findById(currentDocument.defenseId);
      if (!defense) {
        this.logger.error(`Defense não encontrada: ${currentDocument.defenseId}`);
        throw new Error('Defense não encontrada');
      }

      defense.setGrade(request.finalGrade);
      await this.defenseRepository.update(defense);

      this.createApprovalsUseCase.execute({ documentId: createdVersion.id }).catch((error) => {
        this.logger.error(`Falha ao criar aprovações: ${error.message}`);
      });

      return {
        previousVersion: currentDocument,
        newVersion: createdVersion,
      };
    } catch (error) {
      this.logger.error(`Falha ao criar nova versão: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao criar nova versão do documento. Tente novamente.');
    }
  }

  private validateDocumentCanBeVersioned(document: Document): void {
    if (document.isPending()) {
      throw new BadRequestException('Documento PENDING não pode ser versionado. Use o fluxo de rejeição para correções.');
    }

    if (document.isInactive()) {
      throw new BadRequestException('Documento já está inativo. Versione a versão ativa mais recente.');
    }

    if (!document.isApproved()) {
      throw new BadRequestException('Apenas documentos APPROVED podem ser versionados.');
    }

    if (!document.blockchainTxId) {
      throw new BadRequestException('Documento ainda não foi registrado na blockchain. Aguarde o registro antes de versionar.');
    }
  }
}
