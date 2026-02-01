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
    await this.validateUniqueHashes(dto);
    const document = this.createDocumentEntity(dto);
    const created = await this.documentRepository.create(document);

    return DocumentResponseDto.fromEntity(created);
  }

  private async validateUniqueHashes(dto: CreateDocumentDto): Promise<void> {
    if (dto.minutesHash) {
      await this.validateHashDoesNotExist(dto.minutesHash);
    }
    if (dto.evaluationHash) {
      await this.validateHashDoesNotExist(dto.evaluationHash);
    }
  }

  private async validateHashDoesNotExist(hash: string): Promise<void> {
    const hashExists = await this.documentRepository.existsByHash(hash);
    if (hashExists) {
      throw new DocumentHashAlreadyExistsError();
    }
  }

  private createDocumentEntity(dto: CreateDocumentDto): Document {
    return Document.create({
      minutesHash: dto.minutesHash,
      minutesCid: dto.minutesCid,
      evaluationHash: dto.evaluationHash,
      evaluationCid: dto.evaluationCid,
      defenseId: dto.defenseId,
    });
  }
}
