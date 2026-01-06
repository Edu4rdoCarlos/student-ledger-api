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
    if (dto.documentHash) {
      const hashExists = await this.documentRepository.existsByHash(dto.documentHash);
      if (hashExists) {
        throw new DocumentHashAlreadyExistsError();
      }
    }

    const document = Document.create({
      type: dto.type,
      documentHash: dto.documentHash,
      documentCid: dto.documentCid,
      defenseId: dto.defenseId,
    });

    const created = await this.documentRepository.create(document);
    return DocumentResponseDto.fromEntity(created);
  }
}
