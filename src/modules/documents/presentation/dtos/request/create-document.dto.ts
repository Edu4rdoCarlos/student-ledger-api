import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, Length } from 'class-validator';
import { DocumentType } from '../../../domain/entities';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  tipo: DocumentType;

  @ApiProperty({ example: 'a1b2c3d4...', description: 'SHA-256 hash (64 caracteres)' })
  @IsString()
  @Length(64, 64)
  @IsNotEmpty()
  documentoHash: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arquivoPath?: string;

  @ApiProperty({ example: 'uuid-da-defesa' })
  @IsUUID()
  @IsNotEmpty()
  defenseId: string;
}
