import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: '20231001', description: 'Matrícula do aluno' })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({ example: 'aluno@ufrgs.edu.br', description: 'Email do aluno' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome completo do aluno' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'uuid-da-organizacao', description: 'ID da organização', required: false })
  @IsUUID()
  organizationId?: string;
}
