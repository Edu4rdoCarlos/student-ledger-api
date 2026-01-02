import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../domain/entities';

export class StudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(student: Student): StudentResponseDto {
    return {
      id: student.id,
      matricula: student.matricula,
      nome: student.nome,
      email: student.email,
      courseId: student.courseId,
      organizationId: student.organizationId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
