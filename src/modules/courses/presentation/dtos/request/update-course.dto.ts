import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'Ciência da Computação', description: 'Nome do curso', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 'Instituto de Informática', description: 'Departamento do curso', required: false })
  @IsString()
  @IsOptional()
  departamento?: string;

  @ApiProperty({ example: true, description: 'Indica se o curso está ativo', required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({ example: 'uuid-do-coordenador', description: 'ID do coordenador do curso', required: false })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;
}
