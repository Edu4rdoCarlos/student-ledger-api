import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'orientador@ufrgs.edu.br', description: 'Email do orientador' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Prof. Dr. João Silva', description: 'Nome completo do orientador' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'uuid-do-departamento', description: 'ID do departamento', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: 'Machine Learning', description: 'Área de especialização do orientador', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Especialização deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Especialização deve ter no máximo 200 caracteres' })
  specialization?: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
