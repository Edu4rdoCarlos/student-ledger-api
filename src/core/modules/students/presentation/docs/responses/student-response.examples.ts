import { ApprovalStatus, ApprovalRole } from '../../../../approvals/domain/entities';
import { DefenseStatus, DefenseResult } from '../../../../defenses/domain/entities';
import { DocumentStatus } from '../../../../documents/domain/entities';

export const STUDENT_RESPONSE_EXAMPLE = {
  studentRegistration: '202301',
  title: 'Sistema de Gerenciamento de TCC com Blockchain',
  defenseDate: '2024-01-05T10:00:00.000Z',
  location: 'Sala 301 - Prédio da Computação',
  finalGrade: 8.5,
  result: DefenseResult.APPROVED,
  reason: '',
  registeredBy: 'coordinator@ifal.local',
  defenseStatus: DefenseStatus.COMPLETED,
  advisor: {
    id: 'advisor-uuid-123',
    name: 'Prof. Dr. João Silva',
    email: 'joao.silva@ifal.local',
    specialization: 'Engenharia de Software',
    isActive: true,
  },
  examBoard: [
    {
      name: 'Prof. Dr. Carlos Alberto Silva',
      email: 'carlos.silva@ifal.local',
    },
    {
      name: 'Profa. Dra. Maria Fernanda Costa',
      email: 'maria.costa@ifal.local',
    },
    {
      name: 'Prof. Dr. João Pedro Santos',
      email: 'joao.santos@ifal.local',
    },
  ],
  coStudents: [
    {
      id: 'student-uuid-789',
      registration: '00678901',
      name: 'Beatriz Lima Souza',
      email: 'aluno6@academico.example.com',
    },
  ],
  signatures: [
    {
      role: ApprovalRole.COORDINATOR,
      email: 'coordinator@ifal.local',
      timestamp: '2024-01-05T10:30:00.000Z',
      status: ApprovalStatus.APPROVED,
    },
    {
      role: ApprovalRole.ADVISOR,
      email: 'advisor@ifal.local',
      timestamp: '2024-01-05T10:15:00.000Z',
      status: ApprovalStatus.REJECTED,
      justification: 'Document does not meet minimum formatting requirements',
    },
    {
      role: ApprovalRole.STUDENT,
      email: 'student@ifal.local',
      timestamp: '2024-01-05T10:05:00.000Z',
      status: ApprovalStatus.APPROVED,
    },
  ],
  validatedAt: '2024-01-05T10:30:00.000Z',
  documents: [
    {
      id: 'doc-uuid-v2',
      version: 2,
      status: DocumentStatus.APPROVED,
      changeReason: 'Correção de nota final após revisão',
      minutesCid: 'QmX1234567890abcdefghijklmnop',
      evaluationCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
      blockchainRegisteredAt: '2024-01-05T10:30:00.000Z',
      createdAt: '2024-01-05T10:00:00.000Z',
    },
    {
      id: 'doc-uuid-v1',
      version: 1,
      status: DocumentStatus.INACTIVE,
      changeReason: undefined,
      minutesCid: 'QmY9876543210zyxwvutsrqponml',
      evaluationCid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi2',
      blockchainRegisteredAt: '2024-01-04T15:00:00.000Z',
      createdAt: '2024-01-04T14:30:00.000Z',
    },
  ],
};
