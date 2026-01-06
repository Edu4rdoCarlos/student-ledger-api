import { Injectable, Inject, InternalServerErrorException, Logger } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import {
  Document,
  DocumentType
} from '../../../documents/domain/entities';
import {
  IDocumentRepository,
  DOCUMENT_REPOSITORY
} from '../../../documents/application/ports';
import { HashUtil } from '../../../documents/infra/utils/hash.util';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { NotifyDefenseResultUseCase } from './notify-defense-result.use-case';
import { CreateApprovalsUseCase } from '../../../approvals/application/use-cases';

interface SubmitDefenseResultRequest {
  id: string;
  finalGrade: number;
  documentFile: Buffer;
  documentFilename: string;
}

interface SubmitDefenseResultResponse {
  defense: Defense;
  document: Document;
}

@Injectable()
export class SubmitDefenseResultUseCase {
  private readonly logger = new Logger(SubmitDefenseResultUseCase.name);

  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly hashUtil: HashUtil,
    private readonly ipfsService: IpfsService,
    private readonly notifyDefenseResultUseCase: NotifyDefenseResultUseCase,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    const documentHash = this.hashUtil.calculateSha256(request.documentFile);

    let documentCid: string;
    try {
      const ipfsResult = await this.ipfsService.uploadFile(
        request.documentFile,
        request.documentFilename
      );

      if ('queued' in ipfsResult) {
        this.logger.warn('Upload IPFS enfileirado - será processado em breve');
        throw new InternalServerErrorException('Sistema de armazenamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }

      documentCid = ipfsResult.cid;
    } catch (error) {
      this.logger.error(`Falha ao fazer upload para IPFS: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo. Tente novamente.');
    }

    const document = Document.create({
      type: DocumentType.ATA,
      documentHash,
      documentCid,
      defenseId: request.id,
    });

    try {
      const createdDocument = await this.documentRepository.create(document);

      defense.setGrade(request.finalGrade);
      const updatedDefense = await this.defenseRepository.update(defense);

      this.notifyDefenseResultUseCase.execute(request.id).catch((error) => {
        this.logger.error(`Falha ao enviar notificação: ${error.message}`);
      });

      this.createApprovalsUseCase.execute({ documentId: createdDocument.id }).catch((error) => {
        this.logger.error(`Falha ao criar aprovações: ${error.message}`);
      });

      return {
        defense: updatedDefense,
        document: createdDocument,
      };
    } catch (error) {
      this.logger.error(`Falha ao criar documento/atualizar defesa: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao processar resultado da defesa. Tente novamente.');
    }
  }
}
