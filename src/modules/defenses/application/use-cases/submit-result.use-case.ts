import { Injectable, Inject } from '@nestjs/common';
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
import { MongoStorageService } from '../../../../shared/storage';
import { NotifyDefenseResultUseCase } from './notify-defense-result.use-case';

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
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly mongoStorage: MongoStorageService,
    private readonly notifyDefenseResultUseCase: NotifyDefenseResultUseCase,
  ) {}

  async execute(request: SubmitDefenseResultRequest): Promise<SubmitDefenseResultResponse> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    // 1. Set the grade on the defense
    defense.setGrade(request.finalGrade);

    // 2. Create the defense document (without IPFS hash yet)
    const document = Document.create({
      type: DocumentType.ATA,
      defenseId: request.id,
    });

    // 3. Save document to PostgreSQL to get the ID
    const createdDocument = await this.documentRepository.create(document);

    // 4. Upload file to MongoDB GridFS using document ID
    await this.mongoStorage.uploadFile(
      createdDocument.id,
      request.documentFile,
      request.documentFilename
    );

    // 5. Update document with MongoDB file ID
    createdDocument.setMongoFileId(createdDocument.id);
    const updatedDocument = await this.documentRepository.update(createdDocument);

    // 6. Update defense
    const updatedDefense = await this.defenseRepository.update(defense);

    // 7. Send notification emails about the result
    await this.notifyDefenseResultUseCase.execute(request.id);

    return {
      defense: updatedDefense,
      document: updatedDocument,
    };
  }
}
