import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateAdvisorDto {
  @ApiProperty({ example: 'Prof. Dr. João Silva Santos', description: 'Nome completo do orientador', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Instituto de Informática', description: 'Departamento do orientador', required: false })
  @IsString()
  @IsOptional()
  departamento?: string;

  @ApiProperty({ example: 'Machine Learning', description: 'Área de especialização do orientador', required: false })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
