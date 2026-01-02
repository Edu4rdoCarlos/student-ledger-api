import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: '20231001' })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'joao.silva@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'uuid-do-curso' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'uuid-da-organizacao' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
