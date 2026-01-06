import { Inject, Injectable } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { ValidateDocumentResponseDto, SimpleDocumentDto } from '../../presentation/dtos';
import { HashUtil } from '../../infra/utils/hash.util';
import { Document } from '../../domain/entities';

@Injectable()
export class ValidateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly hashUtil: HashUtil,
  ) {}

  private toSimpleDto(document: Document): SimpleDocumentDto {
    return {
      id: document.id,
      type: document.type,
      documentHash: document.documentHash,
      documentCid: document.documentCid,
      status: document.status,
    };
  }

  async execute(fileBuffer: Buffer): Promise<ValidateDocumentResponseDto> {
    const hash = this.hashUtil.calculateSha256(fileBuffer);

    const document = await this.documentRepository.findByHash(hash);

    if (!document) {
      return {
        isValid: false,
        message: 'Documento não encontrado no sistema',
      };
    }

    if (document.isInactive()) {
      return {
        isValid: false,
        document: this.toSimpleDto(document),
        message: 'Documento foi inativado',
      };
    }

    if (!document.isApproved()) {
      return {
        isValid: false,
        document: this.toSimpleDto(document),
        message: 'Documento ainda não foi aprovado',
      };
    }

    return {
      isValid: true,
      document: this.toSimpleDto(document),
      message: 'Documento válido e registrado na blockchain',
    };
  }
}
