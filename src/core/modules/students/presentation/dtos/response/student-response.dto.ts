import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentVersionDto } from '../../../../defenses/presentation/dtos/response/document-version.dto';
import { ApprovalStatus, ApprovalRole } from '../../../../approvals/domain/entities';
import { DefenseStatus, DefenseResult } from '../../../../defenses/domain/entities';

export class ExamBoardMember {
  @ApiProperty({ description: 'Nome do membro da banca', example: 'Prof. Dr. Carlos Alberto Silva' })
  name: string;

  @ApiProperty({ description: 'Email do membro da banca', example: 'carlos.silva@ifal.local' })
  email: string;
}

export class DefenseSignature {
  @ApiProperty({ description: 'Papel do signatário', example: ApprovalRole.COORDINATOR, enum: ApprovalRole })
  role: ApprovalRole;

  @ApiProperty({ description: 'Email do signatário', example: 'coordinator@ifal.local' })
  email: string;

  @ApiProperty({ description: 'Data e hora da assinatura', example: '2024-01-05T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Status da assinatura', example: ApprovalStatus.APPROVED, enum: ApprovalStatus })
  status: ApprovalStatus;

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

  @ApiProperty({ description: 'Indica se o orientador está ativo', example: true })
  isActive: boolean;
}

export class CoStudent {
  @ApiProperty({ description: 'ID do estudante', example: 'student-uuid-456' })
  id: string;

  @ApiProperty({ description: 'Matrícula do estudante', example: '00678901' })
  registration: string;

  @ApiProperty({ description: 'Nome do estudante', example: 'Beatriz Lima Souza' })
  name: string;

  @ApiProperty({ description: 'Email do estudante', example: 'aluno6@academico.example.com' })
  email: string;
}

export class DefenseRecordDto {
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

  @ApiProperty({ description: 'Resultado da defesa', example: DefenseResult.APPROVED, enum: DefenseResult })
  result: DefenseResult;

  @ApiProperty({ description: 'Motivo (se reprovado)', example: '' })
  reason: string;

  @ApiProperty({ description: 'Email de quem registrou', example: 'coordinator@ifal.local' })
  registeredBy: string;

  @ApiProperty({ description: 'Status da defesa', example: DefenseStatus.COMPLETED, enum: DefenseStatus })
  defenseStatus: DefenseStatus;

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

  @ApiProperty({
    description: 'Histórico de versões do documento, ordenadas da mais recente para a mais antiga',
    type: [DocumentVersionDto],
    isArray: true
  })
  documents: DocumentVersionDto[];
}

export interface DefenseRecord {
  studentRegistration: string;
  title: string;
  defenseDate: string;
  location?: string;
  finalGrade: number;
  result: DefenseResult;
  reason: string;
  registeredBy: string;
  defenseStatus: DefenseStatus;
  advisor?: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
    isActive: boolean;
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
    role: ApprovalRole;
    email: string;
    timestamp: string;
    status: ApprovalStatus;
    justification?: string;
  }>;
  validatedAt: string;
  documents: Array<{
    id: string;
    version: number;
    status: string;
    changeReason?: string;
    minutesCid?: string;
    evaluationCid?: string;
    blockchainTxId?: string;
    blockchainRegisteredAt?: Date;
    createdAt: Date;
    downloadUrl?: string;
  }>;
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
  isActive: boolean;
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
    description: 'Lista de IDs das defesas do estudante. Use GET /defenses/:id para obter detalhes completos de cada defesa.',
    type: [String],
    isArray: true,
    example: ['def-uuid-1', 'def-uuid-2'],
  })
  defenseIds?: string[];
}
