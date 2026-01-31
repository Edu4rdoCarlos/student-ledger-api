import { Inject, Injectable } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { DocumentNotFoundError } from '../../domain/errors';
import { DocumentResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(id: string): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new DocumentNotFoundError(id);
    }

    return DocumentResponseDto.fromEntity(document);
  }
}
