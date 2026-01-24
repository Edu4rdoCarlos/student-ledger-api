import { Inject, Injectable } from '@nestjs/common';
import { Document } from '../../domain/entities';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { DocumentHashAlreadyExistsError } from '../../domain/errors';
import { CreateDocumentDto, DocumentResponseDto } from '../../presentation/dtos';

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(dto: CreateDocumentDto): Promise<DocumentResponseDto> {
    // Check if any of the hashes already exist
    if (dto.minutesHash) {
      const hashExists = await this.documentRepository.existsByHash(dto.minutesHash);
      if (hashExists) {
        throw new DocumentHashAlreadyExistsError();
      }
    }
    if (dto.evaluationHash) {
      const hashExists = await this.documentRepository.existsByHash(dto.evaluationHash);
      if (hashExists) {
        throw new DocumentHashAlreadyExistsError();
      }
    }

    const document = Document.create({
      minutesHash: dto.minutesHash,
      minutesCid: dto.minutesCid,
      evaluationHash: dto.evaluationHash,
      evaluationCid: dto.evaluationCid,
      defenseId: dto.defenseId,
    });

    const created = await this.documentRepository.create(document);
    return DocumentResponseDto.fromEntity(created);
  }
}
