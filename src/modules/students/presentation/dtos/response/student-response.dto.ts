import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STUDENT_RESPONSE_EXAMPLE } from '../../docs/responses';

export class ExamBoardMember {
  @ApiProperty({ description: 'Nome do membro da banca', example: 'Prof. Dr. Carlos Alberto Silva' })
  name: string;

  @ApiProperty({ description: 'Email do membro da banca', example: 'carlos.silva@ifal.local' })
  email: string;
}

export class DefenseSignature {
  @ApiProperty({ description: 'Papel do signatário', example: 'coordinator', enum: ['coordinator', 'advisor', 'student'] })
  role: string;

  @ApiProperty({ description: 'Email do signatário', example: 'coordinator@ifal.local' })
  email: string;

  @ApiProperty({ description: 'Data e hora da assinatura', example: '2024-01-05T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Status da assinatura', example: 'APPROVED', enum: ['APPROVED', 'REJECTED', 'PENDING'] })
  status: 'APPROVED' | 'REJECTED' | 'PENDING';

  @ApiPropertyOptional({ description: 'Justificativa para rejeição', example: 'Document does not meet minimum formatting requirements' })
  justification?: string;
}

export class AdvisorInDefense {
  @ApiProperty({ description: 'ID do orientador', example: 'advisor-uuid-123' })
  id: string;

  @ApiProperty({ description: 'Nome do orientador', example: 'Prof. Dr. João Silva' })
  name: string;

  @ApiProperty({ description: 'Email do orientador', example: 'joao.silva@ifal.local' })
  email: string;

  @ApiPropertyOptional({ description: 'Especialização do orientador', example: 'Engenharia de Software' })
  specialization?: string;
}

export class CoStudent {
  @ApiProperty({ description: 'ID do estudante', example: 'student-uuid-456' })
  id: string;

  @ApiProperty({ description: 'Matrícula do estudante', example: '00678901' })
  registration: string;

  @ApiProperty({ description: 'Nome do estudante', example: 'Beatriz Lima Souza' })
  name: string;

  @ApiProperty({ description: 'Email do estudante', example: 'aluno6@ufrgs.edu.br' })
  email: string;
}

export class DefenseRecordDto {
  @ApiProperty({ description: 'ID do documento', example: 'DOC_202301_1_1704459600000' })
  documentId: string;

  @ApiProperty({ description: 'CID do documento no IPFS', example: 'QmX1234567890abcdefghijklmnop' })
  ipfsCid: string;

  @ApiProperty({ description: 'Matrícula do estudante', example: '202301' })
  studentRegistration: string;

  @ApiProperty({ description: 'Título do trabalho', example: 'Sistema de Gerenciamento de TCC com Blockchain' })
  title: string;

  @ApiProperty({ description: 'Data da defesa', example: '2024-01-05T10:00:00.000Z' })
  defenseDate: string;

  @ApiPropertyOptional({ description: 'Local da defesa', example: 'Sala 301 - Prédio da Computação' })
  location?: string;

  @ApiProperty({ description: 'Nota final', example: 8.5, minimum: 0, maximum: 10 })
  finalGrade: number;

  @ApiProperty({ description: 'Resultado da defesa', example: 'APPROVED', enum: ['APPROVED', 'FAILED'] })
  result: 'APPROVED' | 'FAILED';

  @ApiProperty({ description: 'Versão do documento', example: 1 })
  version: number;

  @ApiProperty({ description: 'Motivo (se reprovado)', example: '' })
  reason: string;

  @ApiProperty({ description: 'Email de quem registrou', example: 'coordinator@ifal.local' })
  registeredBy: string;

  @ApiProperty({ description: 'Status da defesa', example: 'COMPLETED', enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'] })
  defenseStatus: 'SCHEDULED' | 'CANCELED' | 'COMPLETED';

  @ApiProperty({ description: 'Status do documento', example: 'APPROVED', enum: ['PENDING', 'APPROVED', 'INACTIVE'] })
  documentStatus: 'PENDING' | 'APPROVED' | 'INACTIVE';

  @ApiPropertyOptional({
    description: 'Orientador da defesa',
    type: AdvisorInDefense
  })
  advisor?: AdvisorInDefense;

  @ApiPropertyOptional({
    description: 'Banca examinadora',
    type: [ExamBoardMember],
    isArray: true
  })
  examBoard?: ExamBoardMember[];

  @ApiPropertyOptional({
    description: 'Outros estudantes participantes da defesa (TCC em dupla/grupo)',
    type: [CoStudent],
    isArray: true
  })
  coStudents?: CoStudent[];

  @ApiProperty({
    description: 'Assinaturas do documento',
    type: [DefenseSignature],
    isArray: true
  })
  signatures: DefenseSignature[];

  @ApiProperty({ description: 'Data de validação no blockchain', example: '2024-01-05T10:30:00.000Z' })
  validatedAt: string;
}

export interface DefenseRecord {
  documentId: string;
  ipfsCid: string;
  studentRegistration: string;
  title: string;
  defenseDate: string;
  location?: string;
  finalGrade: number;
  result: 'APPROVED' | 'FAILED';
  version: number;
  reason: string;
  registeredBy: string;
  defenseStatus: 'SCHEDULED' | 'CANCELED' | 'COMPLETED';
  documentStatus: 'PENDING' | 'APPROVED' | 'INACTIVE';
  advisor?: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
  };
  examBoard?: Array<{
    name: string;
    email: string;
  }>;
  coStudents?: Array<{
    id: string;
    registration: string;
    name: string;
    email: string;
  }>;
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

export interface AdvisorInfo {
  id: string;
  name: string;
  email: string;
  specialization?: string;
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
    type: DefenseRecordDto,
    isArray: true,
    example: [STUDENT_RESPONSE_EXAMPLE],
  })
  defenses?: DefenseRecord[];
}
