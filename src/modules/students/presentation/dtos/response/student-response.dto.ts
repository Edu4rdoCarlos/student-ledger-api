import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    timestamp: string;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    justification?: string;
  }>;
  validatedAt: string;
}

export interface CourseInfo {
  id: string;
  name: string;
  code: string;
}

export class StudentResponseDto {
  @ApiProperty({ description: 'ID do usuário do estudante' })
  userId: string;

  @ApiProperty({ description: 'Matrícula do estudante' })
  registration: string;

  @ApiProperty({ description: 'Nome do estudante' })
  name: string;

  @ApiProperty({ description: 'Email do estudante' })
  email: string;

  @ApiProperty({
    description: 'Informações do curso',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID do curso' },
      name: { type: 'string', description: 'Nome do curso' },
      code: { type: 'string', description: 'Código do curso' },
    },
  })
  course: CourseInfo;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Histórico de defesas registradas no blockchain (apenas no GET /:registration)',
    type: 'array',
    example: [STUDENT_RESPONSE_EXAMPLE],
  })
  defenses?: DefenseRecord[];
}
