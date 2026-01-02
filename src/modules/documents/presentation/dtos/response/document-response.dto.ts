import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, DocumentType, DocumentStatus } from '../../../domain/entities';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DocumentType })
  tipo: DocumentType;

  @ApiProperty()
  versao: number;

  @ApiProperty()
  documentoHash: string;

  @ApiPropertyOptional()
  arquivoPath?: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional()
  blockchainTxId?: string;

  @ApiPropertyOptional()
  blockchainRegisteredAt?: Date;

  @ApiProperty()
  defenseId: string;

  @ApiPropertyOptional()
  previousVersionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(doc: Document): DocumentResponseDto {
    return {
      id: doc.id,
      tipo: doc.tipo,
      versao: doc.versao,
      documentoHash: doc.documentoHash,
      arquivoPath: doc.arquivoPath,
      status: doc.status,
      blockchainTxId: doc.blockchainTxId,
      blockchainRegisteredAt: doc.blockchainRegisteredAt,
      defenseId: doc.defenseId,
      previousVersionId: doc.previousVersionId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export class ValidateDocumentResponseDto {
  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional()
  document?: DocumentResponseDto;

  @ApiProperty()
  message: string;
}
