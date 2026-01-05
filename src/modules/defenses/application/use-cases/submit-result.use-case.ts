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
import { MongoStorageService } from '../../../../database/mongo';
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
    private readonly mongoStorage: MongoStorageService,
    private readonly notifyDefenseResultUseCase: NotifyDefenseResultUseCase,
    private readonly createApprovalsUseCase: CreateApprovalsUseCase,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    const document = Document.create({
      type: DocumentType.ATA,
      defenseId: request.id,
    });
    const createdDocument = await this.documentRepository.create(document);

    try {
      await this.mongoStorage.uploadFile(
        createdDocument.id,
        request.documentFile,
        request.documentFilename
      );
    } catch (error) {
      this.logger.error(`Failed to upload file to MongoDB: ${error.message}`, error.stack);
      await this.documentRepository.delete(createdDocument.id);
      throw new InternalServerErrorException('Falha ao fazer upload do arquivo. Tente novamente.');
    }

    try {
      createdDocument.setMongoFileId(createdDocument.id);
      const updatedDocument = await this.documentRepository.update(createdDocument);

      defense.setGrade(request.finalGrade);
      const updatedDefense = await this.defenseRepository.update(defense);

      this.notifyDefenseResultUseCase.execute(request.id).catch((error) => {
        this.logger.error(`Failed to send notification: ${error.message}`);
      });

      this.createApprovalsUseCase.execute({ documentId: updatedDocument.id }).catch((error) => {
        this.logger.error(`Failed to create approvals: ${error.message}`);
      });

      return {
        defense: updatedDefense,
        document: updatedDocument,
      };
    } catch (error) {
      this.logger.error(`Failed to update defense/document: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao processar resultado da defesa. Tente novamente.');
    }
  }
}
