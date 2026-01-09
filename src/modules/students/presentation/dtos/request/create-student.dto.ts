import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: '20231001', description: 'Matrícula do aluno' })
  @IsString()
  @IsNotEmpty()
  registration: string;

  @ApiProperty({ example: 'aluno@ufrgs.edu.br', description: 'Email do aluno' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome completo do aluno' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
