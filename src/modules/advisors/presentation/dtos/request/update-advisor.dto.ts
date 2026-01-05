import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateAdvisorDto {
  @ApiProperty({ example: 'Prof. Dr. João Silva Santos', description: 'Nome completo do orientador', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'uuid-do-departamento', description: 'ID do departamento', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: 'Machine Learning', description: 'Área de especialização do orientador', required: false })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
