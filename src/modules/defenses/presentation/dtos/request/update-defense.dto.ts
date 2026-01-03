import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateDefenseDto {
  @ApiProperty({ example: 'Defesa de TCC - Sistema Atualizado', description: 'Título da defesa', required: false })
  @IsString()
  @IsOptional()
  titulo?: string;

  @ApiProperty({ example: '2024-12-21T14:00:00Z', description: 'Data e hora da defesa', required: false })
  @IsDateString()
  @IsOptional()
  dataDefesa?: string;
}
