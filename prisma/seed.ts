import {
  PrismaClient,
  Role,
  DefenseResult,
  DefenseStatus,
  DocumentStatus,
  ApprovalRole,
  ApprovalStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const defaultPassword = await bcrypt.hash('Admin123!', 10);

  console.log('👤 Creating Admin User...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'admin@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Administrador do Sistema',
      role: Role.ADMIN,
        },
  });
  console.log(`  ✓ ${admin.email}`);

  console.log('\n🎓 Creating Coordinators...');

  const coordUser1 = await prisma.user.upsert({
    where: { email: 'coordenador.cc@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'coordenador.cc@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Prof. Dr. Carlos Eduardo Silva',
      role: Role.COORDINATOR,
        },
  });

  const coordinator1 = await prisma.coordinator.upsert({
    where: { id: coordUser1.id },
    update: {},
    create: {
      id: coordUser1.id,
    },
  });

  const coordUser2 = await prisma.user.upsert({
    where: { email: 'coordenador.si@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'coordenador.si@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Profa. Dra. Maria Fernanda Costa',
      role: Role.COORDINATOR,
        },
  });

  const coordinator2 = await prisma.coordinator.upsert({
    where: { id: coordUser2.id },
    update: {},
    create: {
      id: coordUser2.id,
    },
  });

  console.log(`  ✓ ${coordUser1.email}`);
  console.log(`  ✓ ${coordUser2.email}`);

  console.log('\n📚 Creating Courses...');

  const courseCC = await prisma.course.upsert({
    where: { code: 'CC-UFRGS' },
    update: {},
    create: {
      name: 'Ciência da Computação',
      code: 'CC-UFRGS',
      active: true,
      coordinatorId: coordinator1.id,
    },
  });

  const courseSI = await prisma.course.upsert({
    where: { code: 'SI-UFRGS' },
    update: {},
    create: {
      name: 'Sistemas de Informação',
      code: 'SI-UFRGS',
      active: true,
      coordinatorId: coordinator2.id,
    },
  });

  const courseInativo = await prisma.course.upsert({
    where: { code: 'EC-UFRGS' },
    update: {},
    create: {
      name: 'Engenharia de Computação',
      code: 'EC-UFRGS',
      active: false,
    },
  });

  console.log(`  ✓ ${courseCC.name} (ativo)`);
  console.log(`  ✓ ${courseSI.name} (ativo)`);
  console.log(`  ✓ ${courseInativo.name} (inativo)`);

  console.log('\n👨‍🏫 Creating Advisors...');

  const advisorUser1 = await prisma.user.upsert({
    where: { email: 'orientador1@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'orientador1@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Prof. Dr. João Pedro Oliveira',
      role: Role.ADVISOR,
        },
  });

  const advisor1 = await prisma.advisor.upsert({
    where: { id: advisorUser1.id },
    update: {
      specialization: 'Sistemas Distribuídos e Blockchain',
      courseId: courseCC.id,
    },
    create: {
      id: advisorUser1.id,
      specialization: 'Sistemas Distribuídos e Blockchain',
      courseId: courseCC.id,
    },
  });

  const advisorUser2 = await prisma.user.upsert({
    where: { email: 'orientador2@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'orientador2@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Profa. Dra. Ana Paula Santos',
      role: Role.ADVISOR,
        },
  });

  const advisor2 = await prisma.advisor.upsert({
    where: { id: advisorUser2.id },
    update: {
      specialization: 'Inteligência Artificial e Machine Learning',
      courseId: courseSI.id,
    },
    create: {
      id: advisorUser2.id,
      specialization: 'Inteligência Artificial e Machine Learning',
      courseId: courseSI.id,
    },
  });

  console.log(`  ✓ ${advisorUser1.email}`);
  console.log(`  ✓ ${advisorUser2.email}`);

  console.log('\n🎒 Creating Students...');

  // Estudante 1: TCC Aprovado (nota 9.5) - defesa completa e documentos na blockchain
  const studentUser1 = await prisma.user.upsert({
    where: { email: 'aluno1@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno1@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Lucas Silva Pereira',
      role: Role.STUDENT,
        },
  });

  const student1 = await prisma.student.upsert({
    where: { registration: '00123456' },
    update: {},
    create: {
      id: studentUser1.id,
      registration: '00123456',
      courseId: courseCC.id,
    },
  });

  // Estudante 2: TCC Reprovado (nota 4.0)
  const studentUser2 = await prisma.user.upsert({
    where: { email: 'aluno2@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno2@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Mariana Costa Ferreira',
      role: Role.STUDENT,
        },
  });

  const student2 = await prisma.student.upsert({
    where: { registration: '00234567' },
    update: { courseId: courseCC.id },
    create: {
      id: studentUser2.id,
      registration: '00234567',
      courseId: courseCC.id,
    },
  });

  // Estudante 3: TCC Pendente - defesa agendada para o futuro
  const studentUser3 = await prisma.user.upsert({
    where: { email: 'aluno3@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno3@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Pedro Henrique Souza',
      role: Role.STUDENT,
        },
  });

  const student3 = await prisma.student.upsert({
    where: { registration: '00345678' },
    update: {},
    create: {
      id: studentUser3.id,
      registration: '00345678',
      courseId: courseCC.id,
    },
  });

  // Estudante 4: Sem TCC ainda - apenas cadastrado no sistema
  const studentUser4 = await prisma.user.upsert({
    where: { email: 'aluno4@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno4@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Juliana Martins Oliveira',
      role: Role.STUDENT,
        },
  });

  const student4 = await prisma.student.upsert({
    where: { registration: '00456789' },
    update: { courseId: courseCC.id },
    create: {
      id: studentUser4.id,
      registration: '00456789',
      courseId: courseCC.id,
    },
  });

  // Estudante 5: TCC em dupla com estudante 6 - Aprovado com nota 8.0
  const studentUser5 = await prisma.user.upsert({
    where: { email: 'aluno5@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno5@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Rafael Santos Costa',
      role: Role.STUDENT,
        },
  });

  const student5 = await prisma.student.upsert({
    where: { registration: '00567890' },
    update: {},
    create: {
      id: studentUser5.id,
      registration: '00567890',
      courseId: courseCC.id,
    },
  });

  // Estudante 6: TCC em dupla com estudante 5 - Aprovado com nota 8.0
  const studentUser6 = await prisma.user.upsert({
    where: { email: 'aluno6@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno6@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Beatriz Lima Souza',
      role: Role.STUDENT,
        },
  });

  const student6 = await prisma.student.upsert({
    where: { registration: '00678901' },
    update: {},
    create: {
      id: studentUser6.id,
      registration: '00678901',
      courseId: courseCC.id,
    },
  });

  // Estudante 7: TCC agendado - documentos sob aprovação (aprovações parciais)
  const studentUser7 = await prisma.user.upsert({
    where: { email: 'aluno7@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno7@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Gabriel Ferreira Alves',
      role: Role.STUDENT,
        },
  });

  const student7 = await prisma.student.upsert({
    where: { registration: '00789012' },
    update: { courseId: courseCC.id },
    create: {
      id: studentUser7.id,
      registration: '00789012',
      courseId: courseCC.id,
    },
  });

  // Estudante 8: TCC cancelado - defesa foi cancelada
  const studentUser8 = await prisma.user.upsert({
    where: { email: 'aluno8@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno8@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Carolina Rocha Mendes',
      role: Role.STUDENT,
        },
  });

  const student8 = await prisma.student.upsert({
    where: { registration: '00890123' },
    update: {},
    create: {
      id: studentUser8.id,
      registration: '00890123',
      courseId: courseCC.id,
    },
  });

  // Estudante 9: TCC aprovado no limite - nota 7.0
  const studentUser9 = await prisma.user.upsert({
    where: { email: 'aluno9@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno9@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Felipe Araújo Dias',
      role: Role.STUDENT,
        },
  });

  const student9 = await prisma.student.upsert({
    where: { registration: '00901234' },
    update: { courseId: courseCC.id },
    create: {
      id: studentUser9.id,
      registration: '00901234',
      courseId: courseCC.id,
    },
  });

  // Estudante 10: TCC com documento rejeitado e versão ajustada - nova versão aprovada
  const studentUser10 = await prisma.user.upsert({
    where: { email: 'aluno10@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno10@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Amanda Silva Rodrigues',
      role: Role.STUDENT,
        },
  });

  const student10 = await prisma.student.upsert({
    where: { registration: '01012345' },
    update: {},
    create: {
      id: studentUser10.id,
      registration: '01012345',
      courseId: courseCC.id,
    },
  });

  // Estudante 11: Com múltiplas defesas - uma cancelada e uma completa
  const studentUser11 = await prisma.user.upsert({
    where: { email: 'aluno11@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno11@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Rodrigo Almeida Santos',
      role: Role.STUDENT,
        },
  });

  const student11 = await prisma.student.upsert({
    where: { registration: '01123456' },
    update: {},
    create: {
      id: studentUser11.id,
      registration: '01123456',
      courseId: courseCC.id,
    },
  });

  console.log(`  ✓ ${studentUser1.email} (${student1.registration}) - TCC Aprovado`);
  console.log(`  ✓ ${studentUser2.email} (${student2.registration}) - TCC Reprovado`);
  console.log(`  ✓ ${studentUser3.email} (${student3.registration}) - TCC Pendente`);
  console.log(`  ✓ ${studentUser4.email} (${student4.registration}) - Sem TCC`);
  console.log(`  ✓ ${studentUser5.email} (${student5.registration}) - TCC em Dupla (Aprovado)`);
  console.log(`  ✓ ${studentUser6.email} (${student6.registration}) - TCC em Dupla (Aprovado)`);
  console.log(`  ✓ ${studentUser7.email} (${student7.registration}) - TCC sob Aprovação`);
  console.log(`  ✓ ${studentUser8.email} (${student8.registration}) - TCC Cancelado`);
  console.log(`  ✓ ${studentUser9.email} (${student9.registration}) - TCC Aprovado (Nota Mínima)`);
  console.log(`  ✓ ${studentUser10.email} (${student10.registration}) - TCC com Versão Ajustada`);
  console.log(`  ✓ ${studentUser11.email} (${student11.registration}) - Múltiplas Defesas (Cancelada + Completa)`);

  console.log('\n📝 Creating Defenses...');

  // Defesa 1: Aprovada - aluno1
  const defenseAprovada = await prisma.defense.upsert({
    where: { id: 'defense-aprovada' },
    update: {},
    create: {
      id: 'defense-aprovada',
      title: 'Sistema Distribuído para Gerenciamento de Documentos Acadêmicos usando Blockchain',
      defenseDate: new Date('2024-12-15T14:00:00Z'),
      location: 'Sala 301 - Prédio da Computação',
      finalGrade: 9.5,
      result: DefenseResult.APPROVED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student1.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Carlos Alberto Silva',
            email: 'carlos.silva@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Maria Fernanda Costa',
            email: 'maria.costa@ufrgs.edu.br',
          },
          {
            name: 'Prof. Dr. João Pedro Santos',
            email: 'joao.santos@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 2: Reprovada - aluno2
  const defenseReprovada = await prisma.defense.upsert({
    where: { id: 'defense-reprovada' },
    update: {},
    create: {
      id: 'defense-reprovada',
      title: 'Análise de Algoritmos de Machine Learning para Detecção de Fraudes',
      defenseDate: new Date('2024-11-20T10:00:00Z'),
      location: 'Auditório Central',
      finalGrade: 4.0,
      result: DefenseResult.FAILED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student2.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Roberto Andrade',
            email: 'roberto.andrade@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Ana Paula Oliveira',
            email: 'ana.oliveira@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 3: Pendente - aluno3
  const defensePendente = await prisma.defense.upsert({
    where: { id: 'defense-pendente' },
    update: {},
    create: {
      id: 'defense-pendente',
      title: 'Desenvolvimento de API RESTful com Arquitetura Hexagonal',
      defenseDate: new Date('2025-02-10T09:00:00Z'),
      location: 'Sala 205 - Bloco IV',
      result: DefenseResult.PENDING,
      status: DefenseStatus.SCHEDULED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student3.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Fernando Lima',
            email: 'fernando.lima@ufrgs.edu.br',
          },
          {
            name: 'Prof. Dr. Ricardo Soares',
            email: 'ricardo.soares@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Juliana Martins',
            email: 'juliana.martins@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 4: TCC em dupla - aprovado (aluno5 e aluno6)
  const defenseDupla = await prisma.defense.upsert({
    where: { id: 'defense-dupla' },
    update: {},
    create: {
      id: 'defense-dupla',
      title: 'Plataforma de E-Learning com Gamificação e IA',
      defenseDate: new Date('2024-10-25T15:00:00Z'),
      location: 'Auditório 2 - Prédio da Computação',
      finalGrade: 8.0,
      result: DefenseResult.APPROVED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: [
          { studentId: student5.id },
          { studentId: student6.id },
        ],
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Marcelo Azevedo',
            email: 'marcelo.azevedo@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Renata Oliveira',
            email: 'renata.oliveira@ufrgs.edu.br',
          },
          {
            name: 'Prof. Dr. Eduardo Costa',
            email: 'eduardo.costa@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 5: Com aprovações parciais - aluno7
  const defenseAprovacaoParcial = await prisma.defense.upsert({
    where: { id: 'defense-aprovacao-parcial' },
    update: {},
    create: {
      id: 'defense-aprovacao-parcial',
      title: 'Sistema de Recomendação Baseado em Redes Neurais',
      defenseDate: new Date('2024-12-10T10:30:00Z'),
      location: 'Sala 102 - Bloco III',
      finalGrade: 8.5,
      result: DefenseResult.APPROVED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student7.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Lucas Barbosa',
            email: 'lucas.barbosa@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Camila Dias',
            email: 'camila.dias@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 6: Cancelada - aluno8
  const defenseCancelada = await prisma.defense.upsert({
    where: { id: 'defense-cancelada' },
    update: {},
    create: {
      id: 'defense-cancelada',
      title: 'Análise de Performance em Aplicações Web Modernas',
      defenseDate: new Date('2024-09-15T14:00:00Z'),
      location: 'Sala 203 - Prédio Central',
      finalGrade: 0,
      result: DefenseResult.FAILED,
      status: DefenseStatus.CANCELED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student8.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. André Moraes',
            email: 'andre.moraes@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  await prisma.defenseEvent.upsert({
    where: { id: 'event-defense-cancelada' },
    update: {},
    create: {
      id: 'event-defense-cancelada',
      defenseId: defenseCancelada.id,
      type: 'CANCELED',
      reason: 'Estudante solicitou trancamento de matrícula',
    },
  });

  // Defesa 7: Aprovada no limite (nota 7.0) - aluno9
  const defenseNotaMinima = await prisma.defense.upsert({
    where: { id: 'defense-nota-minima' },
    update: {},
    create: {
      id: 'defense-nota-minima',
      title: 'Otimização de Consultas SQL em Bancos Relacionais',
      defenseDate: new Date('2024-08-30T11:00:00Z'),
      location: 'Sala 404 - Bloco V',
      finalGrade: 7.0,
      result: DefenseResult.APPROVED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student9.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Fábio Mendes',
            email: 'fabio.mendes@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Patrícia Nogueira',
            email: 'patricia.nogueira@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  // Defesa 8: Com documento rejeitado e versão ajustada - aluno10
  const defenseVersaoAjustada = await prisma.defense.upsert({
    where: { id: 'defense-versao-ajustada' },
    update: {},
    create: {
      id: 'defense-versao-ajustada',
      title: 'Implementação de Microsserviços com Docker e Kubernetes',
      defenseDate: new Date('2024-07-18T16:00:00Z'),
      location: 'Auditório 1 - Prédio da Engenharia',
      finalGrade: 8.5,
      result: DefenseResult.APPROVED,
      status: DefenseStatus.COMPLETED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student10.id,
        },
      },
      examBoard: {
        create: [
          {
            name: 'Prof. Dr. Thiago Prado',
            email: 'thiago.prado@ufrgs.edu.br',
          },
          {
            name: 'Profa. Dra. Larissa Campos',
            email: 'larissa.campos@ufrgs.edu.br',
          },
          {
            name: 'Prof. Dr. Vinícius Almeida',
            email: 'vinicius.almeida@ufrgs.edu.br',
          },
        ],
      },
    },
  });

  console.log(`  ✓ "${defenseAprovada.title.substring(0, 50)}..." (APROVADO)`);
  console.log(`  ✓ "${defenseReprovada.title.substring(0, 50)}..." (REPROVADO)`);
  console.log(`  ✓ "${defensePendente.title.substring(0, 50)}..." (PENDENTE)`);
  console.log(`  ✓ "${defenseDupla.title.substring(0, 50)}..." (DUPLA APROVADA)`);
  console.log(`  ✓ "${defenseAprovacaoParcial.title.substring(0, 50)}..." (APROVAÇÃO PARCIAL)`);
  console.log(`  ✓ "${defenseCancelada.title.substring(0, 50)}..." (CANCELADA)`);
  console.log(`  ✓ "${defenseNotaMinima.title.substring(0, 50)}..." (NOTA MÍNIMA)`);
  console.log(`  ✓ "${defenseVersaoAjustada.title.substring(0, 50)}..." (VERSÃO AJUSTADA)`);

  console.log('\n📄 Creating Documents...');

  // Documento 1: ATA aprovada - defesa1
  const docHash1 = crypto.createHash('sha256').update('ata-defense-1-v1').digest('hex');
  const docAta1 = await prisma.document.upsert({
    where: { id: 'doc-ata-1' },
    update: {},
    create: {
      id: 'doc-ata-1',
      
      version: 1,
      documentHash: docHash1,
      status: DocumentStatus.APPROVED,
      defenseId: defenseAprovada.id,
      blockchainTxId: 'tx_abc123def456',
      blockchainRegisteredAt: new Date('2024-12-16T10:00:00Z'),
    },
  });

  // Documento 2: ATA reprovada - defesa2
  const docHash2 = crypto.createHash('sha256').update('ata-defense-2-v1').digest('hex');
  const docReprovada = await prisma.document.upsert({
    where: { id: 'doc-ata-reprovada' },
    update: {},
    create: {
      id: 'doc-ata-reprovada',
      
      version: 1,
      documentHash: docHash2,
      status: DocumentStatus.APPROVED,
      defenseId: defenseReprovada.id,
      blockchainTxId: 'tx_reprovada456xyz',
      blockchainRegisteredAt: new Date('2024-11-21T11:00:00Z'),
    },
  });

  // Documento 3: REMOVIDO - defesa3 está SCHEDULED, não pode ter documento ainda

  // Documento 4: ATA dupla aprovada - defesa4
  const docHash4 = crypto.createHash('sha256').update('ata-defense-dupla-v1').digest('hex');
  const docDupla = await prisma.document.upsert({
    where: { id: 'doc-ata-dupla' },
    update: {},
    create: {
      id: 'doc-ata-dupla',
      
      version: 1,
      documentHash: docHash4,
      status: DocumentStatus.APPROVED,
      defenseId: defenseDupla.id,
      blockchainTxId: 'tx_dupla456xyz789',
      blockchainRegisteredAt: new Date('2024-10-26T09:00:00Z'),
    },
  });

  // Documento 5: ATA com aprovações parciais - defesa5
  const docHash5 = crypto.createHash('sha256').update('ata-defense-parcial-v1').digest('hex');
  const docParcial = await prisma.document.upsert({
    where: { id: 'doc-ata-parcial' },
    update: {},
    create: {
      id: 'doc-ata-parcial',
      
      version: 1,
      documentHash: docHash5,
      status: DocumentStatus.PENDING,
      defenseId: defenseAprovacaoParcial.id,
    },
  });

  // Documento 6: ATA nota mínima - defesa7
  const docHash6 = crypto.createHash('sha256').update('ata-defense-minima-v1').digest('hex');
  const docNotaMinima = await prisma.document.upsert({
    where: { id: 'doc-ata-minima' },
    update: {},
    create: {
      id: 'doc-ata-minima',
      
      version: 1,
      documentHash: docHash6,
      status: DocumentStatus.APPROVED,
      defenseId: defenseNotaMinima.id,
      blockchainTxId: 'tx_minima789abc123',
      blockchainRegisteredAt: new Date('2024-08-31T14:00:00Z'),
    },
  });

  // Documento 7 e 8: Versão ajustada - defesa8
  // Primeira versão rejeitada (inativa)
  const docHash7 = crypto.createHash('sha256').update('ata-defense-ajustada-v1').digest('hex');
  const docAjustadaV1 = await prisma.document.upsert({
    where: { id: 'doc-ata-ajustada-v1' },
    update: {},
    create: {
      id: 'doc-ata-ajustada-v1',

      version: 1,
      documentHash: docHash7,
      status: DocumentStatus.INACTIVE,
      inactivationReason: 'Nova versão criada: Correção de formatação e atualização dos dados da banca examinadora',
      inactivatedAt: new Date('2024-07-22T16:00:00Z'),
      defenseId: defenseVersaoAjustada.id,
      blockchainTxId: 'tx_ajustada111aaa222',
      blockchainRegisteredAt: new Date('2024-07-19T10:00:00Z'),
    },
  });

  // Segunda versão aprovada (ativa)
  const docHash8 = crypto.createHash('sha256').update('ata-defense-ajustada-v2-corrigida').digest('hex');
  const docAjustadaV2 = await prisma.document.upsert({
    where: { id: 'doc-ata-ajustada-v2' },
    update: {},
    create: {
      id: 'doc-ata-ajustada-v2',
      
      version: 2,
      documentHash: docHash8,
      status: DocumentStatus.APPROVED,
      changeReason: 'Correção de formatação e atualização dos dados da banca examinadora',
      previousVersionId: docAjustadaV1.id,
      defenseId: defenseVersaoAjustada.id,
      blockchainTxId: 'tx_ajustada999fff888',
      blockchainRegisteredAt: new Date('2024-07-22T16:30:00Z'),
    },
  });

  console.log(`  ✓ ATA - Defense 1 (APROVADO, na blockchain)`);
  console.log(`  ✓ ATA - Defense Reprovada (APROVADO, na blockchain)`);
  console.log(`  ✓ ATA - Defense Dupla (APROVADO, na blockchain)`);
  console.log(`  ✓ ATA - Defense Parcial (PENDENTE - aprovações parciais)`);
  console.log(`  ✓ ATA - Defense Nota Mínima (APROVADO, na blockchain)`);
  console.log(`  ✓ ATA - Defense Ajustada v1 (INATIVO - rejeitado)`);
  console.log(`  ✓ ATA - Defense Ajustada v2 (APROVADO - versão corrigida, na blockchain)`);

  console.log('\n✅ Creating Approvals...');

  // Aprovações para documento 1 (todas aprovadas)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAta1.id, role: ApprovalRole.ADVISOR, approverId: advisorUser1.id as string } },
    update: {},
    create: {
      documentId: docAta1.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-12-15T16:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAta1.id, role: ApprovalRole.COORDINATOR, approverId: coordUser1.id as string } },
    update: {},
    create: {
      documentId: docAta1.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.APPROVED,
      approverId: coordUser1.id,
      approvedAt: new Date('2024-12-16T09:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAta1.id, role: ApprovalRole.STUDENT, approverId: studentUser1.id as string } },
    update: {},
    create: {
      documentId: docAta1.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser1.id,
      approvedAt: new Date('2024-12-15T17:00:00Z'),
    },
  });

  // Aprovações para documento 3: REMOVIDAS - defesa está SCHEDULED, não tem documento

  // Aprovações para documento da defesa reprovada (todas aprovadas)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docReprovada.id, role: ApprovalRole.COORDINATOR, approverId: coordUser1.id as string } },
    update: {},
    create: {
      documentId: docReprovada.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.APPROVED,
      approverId: coordUser1.id,
      approvedAt: new Date('2024-11-21T10:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docReprovada.id, role: ApprovalRole.ADVISOR, approverId: advisorUser1.id as string } },
    update: {},
    create: {
      documentId: docReprovada.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-11-21T10:15:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docReprovada.id, role: ApprovalRole.STUDENT, approverId: studentUser2.id as string } },
    update: {},
    create: {
      documentId: docReprovada.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser2.id,
      approvedAt: new Date('2024-11-21T10:30:00Z'),
    },
  });

  // Aprovações para documento dupla (todas aprovadas)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docDupla.id, role: ApprovalRole.ADVISOR, approverId: advisorUser1.id as string } },
    update: {},
    create: {
      documentId: docDupla.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-10-25T17:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docDupla.id, role: ApprovalRole.COORDINATOR, approverId: coordUser1.id as string } },
    update: {},
    create: {
      documentId: docDupla.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.APPROVED,
      approverId: coordUser1.id,
      approvedAt: new Date('2024-10-26T08:30:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: {
      documentId_role_approverId: {
        documentId: docDupla.id,
        role: ApprovalRole.STUDENT,
        approverId: studentUser5.id as string
      }
    },
    update: {},
    create: {
      documentId: docDupla.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser5.id,
      approvedAt: new Date('2024-10-25T18:00:00Z'),
    },
  });

  // Segunda aprovação de estudante para TCC em dupla (aluno6)
  await prisma.approval.upsert({
    where: {
      documentId_role_approverId: {
        documentId: docDupla.id,
        role: ApprovalRole.STUDENT,
        approverId: studentUser6.id as string
      }
    },
    update: {},
    create: {
      documentId: docDupla.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser6.id,
      approvedAt: new Date('2024-10-25T18:15:00Z'),
    },
  });

  // Aprovações para documento parcial (orientador e estudante aprovaram, coordenador pendente)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docParcial.id, role: ApprovalRole.ADVISOR, approverId: advisorUser2.id as string } },
    update: {},
    create: {
      documentId: docParcial.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser2.id,
      approvedAt: new Date('2025-01-12T10:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docParcial.id, role: ApprovalRole.STUDENT, approverId: studentUser7.id as string } },
    update: {},
    create: {
      documentId: docParcial.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser7.id,
      approvedAt: new Date('2025-01-12T11:30:00Z'),
    },
  });

  // Aprovação do coordenador ainda pendente (sem approverId definido)
  await prisma.approval.create({
    data: {
      documentId: docParcial.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.PENDING,
    },
  });

  // Aprovações para documento nota mínima (todas aprovadas)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docNotaMinima.id, role: ApprovalRole.ADVISOR, approverId: advisorUser2.id as string } },
    update: {},
    create: {
      documentId: docNotaMinima.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser2.id,
      approvedAt: new Date('2024-08-30T13:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docNotaMinima.id, role: ApprovalRole.COORDINATOR, approverId: coordUser2.id as string } },
    update: {},
    create: {
      documentId: docNotaMinima.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.APPROVED,
      approverId: coordUser2.id,
      approvedAt: new Date('2024-08-31T09:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docNotaMinima.id, role: ApprovalRole.STUDENT, approverId: studentUser9.id as string } },
    update: {},
    create: {
      documentId: docNotaMinima.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser9.id,
      approvedAt: new Date('2024-08-30T14:00:00Z'),
    },
  });

  // Aprovações para documento versão 1 (rejeitado pelo coordenador)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV1.id, role: ApprovalRole.ADVISOR, approverId: advisorUser1.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV1.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-07-18T18:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV1.id, role: ApprovalRole.STUDENT, approverId: studentUser10.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV1.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser10.id,
      approvedAt: new Date('2024-07-18T19:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV1.id, role: ApprovalRole.COORDINATOR, approverId: coordUser1.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV1.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.REJECTED,
      justification: 'Formatação incorreta e erros nos dados da banca examinadora. Por favor, revisar e reenviar documento corrigido.',
      approverId: coordUser1.id,
    },
  });

  // Aprovações para documento versão 2 (todas aprovadas)
  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV2.id, role: ApprovalRole.ADVISOR, approverId: advisorUser1.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV2.id,
      role: ApprovalRole.ADVISOR,
      status: ApprovalStatus.APPROVED,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-07-22T10:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV2.id, role: ApprovalRole.STUDENT, approverId: studentUser10.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV2.id,
      role: ApprovalRole.STUDENT,
      status: ApprovalStatus.APPROVED,
      approverId: studentUser10.id,
      approvedAt: new Date('2024-07-22T11:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role_approverId: { documentId: docAjustadaV2.id, role: ApprovalRole.COORDINATOR, approverId: coordUser1.id as string } },
    update: {},
    create: {
      documentId: docAjustadaV2.id,
      role: ApprovalRole.COORDINATOR,
      status: ApprovalStatus.APPROVED,
      approverId: coordUser1.id,
      approvedAt: new Date('2024-07-22T15:00:00Z'),
    },
  });

  console.log(`  ✓ 3 aprovações para ATA Defense 1 (todas APPROVED)`);
  console.log(`  ✓ 3 aprovações para ATA Defense Reprovada (todas APPROVED - defesa FAILED)`);
  console.log(`  ✓ 4 aprovações para ATA Defense Dupla (todas APPROVED - TCC em dupla)`);
  console.log(`  ✓ 3 aprovações para ATA Defense Parcial (2 APPROVED, 1 PENDING)`);
  console.log(`  ✓ 3 aprovações para ATA Defense Nota Mínima (todas APPROVED)`);
  console.log(`  ✓ 3 aprovações para ATA Defense Ajustada v1 (2 APPROVED, 1 REJECTED)`);
  console.log(`  ✓ 3 aprovações para ATA Defense Ajustada v2 (todas APPROVED)`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\n📋 Credentials (password: Admin123!):');
  console.log('─'.repeat(50));
  console.log(`  ADMIN:       ${admin.email}`);
  console.log(`  COORDINATOR: ${coordUser1.email}`);
  console.log(`  COORDINATOR: ${coordUser2.email}`);
  console.log(`  ADVISOR:     ${advisorUser1.email}`);
  console.log(`  ADVISOR:     ${advisorUser2.email}`);
  console.log(`  STUDENT:     ${studentUser1.email} - TCC Aprovado`);
  console.log(`  STUDENT:     ${studentUser2.email} - TCC Reprovado`);
  console.log(`  STUDENT:     ${studentUser3.email} - TCC Pendente`);
  console.log(`  STUDENT:     ${studentUser4.email} - Sem TCC`);
  console.log(`  STUDENT:     ${studentUser5.email} - TCC em Dupla`);
  console.log(`  STUDENT:     ${studentUser6.email} - TCC em Dupla`);
  console.log(`  STUDENT:     ${studentUser7.email} - TCC sob Aprovação`);
  console.log(`  STUDENT:     ${studentUser8.email} - TCC Cancelado`);
  console.log(`  STUDENT:     ${studentUser9.email} - TCC Nota Mínima`);
  console.log(`  STUDENT:     ${studentUser10.email} - TCC Versão Ajustada`);
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
