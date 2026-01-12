export const STUDENT_RESPONSE_EXAMPLE = {
  documentId: 'DOC_202301_1_1704459600000',
  ipfsCid: 'QmX1234567890abcdefghijklmnop',
  studentRegistration: '202301',
  title: 'Sistema de Gerenciamento de TCC com Blockchain',
  defenseDate: '2024-01-05T10:00:00.000Z',
  location: 'Sala 301 - Prédio da Computação',
  finalGrade: 8.5,
  result: 'APPROVED',
  version: 1,
  reason: '',
  registeredBy: 'coordinator@ifal.local',
  status: 'APPROVED',
  advisor: {
    id: 'advisor-uuid-123',
    name: 'Prof. Dr. João Silva',
    email: 'joao.silva@ifal.local',
    specialization: 'Engenharia de Software',
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
  signatures: [
    {
      role: 'coordinator',
      email: 'coordinator@ifal.local',
      timestamp: '2024-01-05T10:30:00.000Z',
      status: 'APPROVED',
    },
    {
      role: 'advisor',
      email: 'advisor@ifal.local',
      timestamp: '2024-01-05T10:15:00.000Z',
      status: 'REJECTED',
      justification: 'Document does not meet minimum formatting requirements',
    },
    {
      role: 'student',
      email: 'student@ifal.local',
      timestamp: '2024-01-05T10:05:00.000Z',
      status: 'APPROVED',
    },
  ],
  validatedAt: '2024-01-05T10:30:00.000Z',
};
