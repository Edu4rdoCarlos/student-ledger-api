import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentVersionDto {
  @ApiProperty({
    description: 'Updated final grade (0 to 10)',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsNotEmpty({ message: 'Nota final é obrigatória' })
  @IsNumber({}, { message: 'Nota final deve ser um número' })
  @Min(0, { message: 'Nota final deve ser maior ou igual a 0' })
  @Max(10, { message: 'Nota final deve ser menor ou igual a 10' })
  finalGrade: number;

  @ApiProperty({
    description: 'Reason for creating a new version',
    example: 'Correção de nota final após revisão',
  })
  @IsNotEmpty({ message: 'Motivo da alteração é obrigatório' })
  @IsString({ message: 'Motivo da alteração deve ser uma string' })
  changeReason: string;
}
