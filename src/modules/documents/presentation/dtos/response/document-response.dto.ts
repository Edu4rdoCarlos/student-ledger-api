import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, DocumentType, DocumentStatus } from '../../../domain/entities';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ description: 'IPFS CID - filled when submitted to IPFS' })
  documentHash?: string;

  @ApiPropertyOptional({ description: 'MongoDB GridFS file ID' })
  mongoFileId?: string;

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
      type: doc.type,
      version: doc.version,
      documentHash: doc.documentHash,
      mongoFileId: doc.mongoFileId,
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

export class SimpleDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiPropertyOptional({ description: 'IPFS CID - filled when submitted to IPFS' })
  documentHash?: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;
}

export class ValidateDocumentResponseDto {
  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional({ type: SimpleDocumentDto })
  document?: SimpleDocumentDto;

  @ApiProperty()
  message: string;
}
