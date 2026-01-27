import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateAdvisorDto {
  @ApiProperty({ example: 'orientador@academico.example.com', description: 'Email do orientador' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Prof. Dr. João Silva', description: 'Nome completo do orientador' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'Machine Learning', description: 'Área de especialização do orientador' })
  @IsString()
  @IsNotEmpty({ message: 'Especialização é obrigatória' })
  @MinLength(3, { message: 'Especialização deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Especialização deve ter no máximo 200 caracteres' })
  specialization: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso', required: false })
  @IsUUID()
  @IsOptional()
  courseId?: string;
}
