import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../domain/entities';

export class StudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(student: Student): StudentResponseDto {
    return {
      id: student.id,
      matricula: student.matricula,
      userId: student.userId,
      courseId: student.courseId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
