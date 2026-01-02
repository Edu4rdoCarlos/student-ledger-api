import { Inject, Injectable } from '@nestjs/common';
import { DocumentStatus, DocumentType } from '../../domain/entities';
import { IDocumentRepository, DOCUMENT_REPOSITORY, DocumentFilters } from '../ports';
import { DocumentResponseDto } from '../../presentation/dtos';

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(filters?: DocumentFilters): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.findAll(filters);
    return documents.map(DocumentResponseDto.fromEntity);
  }
}
