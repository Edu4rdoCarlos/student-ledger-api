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
    const hashExists = await this.documentRepository.existsByHash(dto.documentoHash);
    if (hashExists) {
      throw new DocumentHashAlreadyExistsError();
    }

    const document = Document.create({
      tipo: dto.tipo,
      documentoHash: dto.documentoHash,
      arquivoPath: dto.arquivoPath,
      defenseId: dto.defenseId,
    });

    const created = await this.documentRepository.create(document);
    return DocumentResponseDto.fromEntity(created);
  }
}
