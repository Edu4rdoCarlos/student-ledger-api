import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: '20231001', description: 'Matrícula do aluno' })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({ example: 'uuid-do-usuario', description: 'ID do usuário associado' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'uuid-do-curso', description: 'ID do curso' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;
}
