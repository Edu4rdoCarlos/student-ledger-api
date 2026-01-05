import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../domain/entities';

export class StudentResponseDto {
  @ApiProperty({ description: 'ID do estudante' })
  id: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ description: 'ID do usuário associado' })
  userId: string;

  @ApiProperty({ description: 'ID do curso' })
  courseId: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(student: Student): StudentResponseDto {
    return {
      id: student.id,
      registration: student.matricula,
      userId: student.userId,
      courseId: student.courseId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
