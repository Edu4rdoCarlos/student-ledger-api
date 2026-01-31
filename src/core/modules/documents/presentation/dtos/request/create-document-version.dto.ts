import { IsNotEmpty, IsNumber, IsString, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { DocumentType } from '../../../domain/entities';

export class CreateDocumentVersionDto {
  @ApiProperty({
    description: 'Type of document to update (minutes = Ata, evaluation = Avaliação de Desempenho)',
    example: DocumentType.MINUTES,
    enum: DocumentType,
  })
  @IsNotEmpty({ message: 'Tipo de documento é obrigatório' })
  @IsEnum(DocumentType, { message: 'Tipo de documento deve ser "minutes" ou "evaluation"' })
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'Updated final grade (0 to 10). Optional - only required if grade is being changed',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? parseFloat(value) : undefined))
  @IsNumber({}, { message: 'Nota final deve ser um número' })
  @Min(0, { message: 'Nota final deve ser maior ou igual a 0' })
  @Max(10, { message: 'Nota final deve ser menor ou igual a 10' })
  finalGrade?: number;

  @ApiProperty({
    description: 'Reason for creating a new version',
    example: 'Correção de nota final após revisão',
  })
  @IsNotEmpty({ message: 'Motivo da alteração é obrigatório' })
  @IsString({ message: 'Motivo da alteração deve ser uma string' })
  changeReason: string;
}
