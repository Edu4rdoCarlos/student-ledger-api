import { Inject, Injectable } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { ValidateDocumentResponseDto, SimpleDocumentDto } from '../../presentation/dtos';
import { IpfsService } from '../../../ipfs/ipfs.service';
import { Document } from '../../domain/entities';

@Injectable()
export class ValidateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly ipfsService: IpfsService,
  ) {}

  private toSimpleDto(document: Document): SimpleDocumentDto {
    return {
      id: document.id,
      type: document.type,
      documentHash: document.documentHash,
      status: document.status,
    };
  }

  async execute(fileBuffer: Buffer): Promise<ValidateDocumentResponseDto> {
    // Calculate CID from uploaded file without storing it
    const hash = await this.ipfsService.calculateCid(fileBuffer);

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
