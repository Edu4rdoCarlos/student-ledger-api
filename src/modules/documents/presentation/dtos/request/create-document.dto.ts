import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { DocumentType } from '../../../domain/entities';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiPropertyOptional({ example: 'QmXxx...', description: 'IPFS CID - filled when submitted to IPFS' })
  @IsOptional()
  @IsString()
  documentHash?: string;

  @ApiPropertyOptional({ description: 'MongoDB GridFS file ID' })
  @IsOptional()
  @IsString()
  mongoFileId?: string;

  @ApiProperty({ example: 'uuid-da-defesa' })
  @IsUUID()
  @IsNotEmpty()
  defenseId: string;
}
