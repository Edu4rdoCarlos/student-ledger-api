import { Inject, Injectable } from '@nestjs/common';
import { IDocumentRepository, DOCUMENT_REPOSITORY } from '../ports';
import { DocumentResponseDto, ValidateDocumentResponseDto } from '../../presentation/dtos';

@Injectable()
export class ValidateDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(hash: string): Promise<ValidateDocumentResponseDto> {
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
        document: DocumentResponseDto.fromEntity(document),
        message: 'Documento foi inativado',
      };
    }

    if (!document.isApproved()) {
      return {
        isValid: false,
        document: DocumentResponseDto.fromEntity(document),
        message: 'Documento ainda não foi aprovado',
      };
    }

    return {
      isValid: true,
      document: DocumentResponseDto.fromEntity(document),
      message: 'Documento válido e registrado na blockchain',
    };
  }
}
