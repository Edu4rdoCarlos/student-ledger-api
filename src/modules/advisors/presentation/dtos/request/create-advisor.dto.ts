import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'orientador@ufrgs.edu.br', description: 'Email do orientador' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Prof. Dr. João Silva', description: 'Nome completo do orientador' })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiProperty({ example: 'uuid-da-organizacao', description: 'ID da organização', required: false })
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
