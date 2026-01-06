import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../../domain/entities';
import { STUDENT_RESPONSE_EXAMPLE } from '../../docs/responses';

export interface DefenseRecord {
  documentId: string;
  ipfsCid: string;
  studentRegistration: string;
  title: string;
  defenseDate: string;
  finalGrade: number;
  result: 'APPROVED' | 'FAILED';
  version: number;
  reason: string;
  registeredBy: string;
  status: 'APPROVED';
  signatures: Array<{
    role: string;
    email: string;
    mspId: string;
    timestamp: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    justification?: string;
  }>;
  validatedAt: string;
}

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

  @ApiProperty({
    description: 'Histórico de defesas registradas no blockchain',
    type: 'array',
    required: false,
    example: [STUDENT_RESPONSE_EXAMPLE],
  })
  defenses?: DefenseRecord[];

  static fromEntity(student: Student, defenses?: DefenseRecord[]): StudentResponseDto {
    return {
      id: student.id,
      registration: student.matricula,
      userId: student.userId,
      courseId: student.courseId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      defenses: defenses || [],
    };
  }
}
