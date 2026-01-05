import {
  PrismaClient,
  Role,
  OrganizationStatus,
  DefenseResult,
  DocumentType,
  DocumentStatus,
  ApprovalRole,
  ApprovalStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const defaultPassword = await bcrypt.hash('123456', 10);

  console.log('📦 Creating Organizations...');

  const orgAtiva = await prisma.organization.upsert({
    where: { mspId: 'Org1MSP' },
    update: {},
    create: {
      nome: 'Universidade Federal do Rio Grande do Sul',
      mspId: 'Org1MSP',
      peerEndpoint: 'peer0.org1.example.com:7051',
      peerName: 'peer0.org1.example.com',
      status: OrganizationStatus.ATIVA,
    },
  });

  const orgPendente = await prisma.organization.upsert({
    where: { mspId: 'Org2MSP' },
    update: {},
    create: {
      nome: 'Universidade Federal de Santa Catarina',
      mspId: 'Org2MSP',
      peerEndpoint: 'peer0.org2.example.com:7051',
      peerName: 'peer0.org2.example.com',
      status: OrganizationStatus.PENDENTE,
    },
  });

  const orgInativa = await prisma.organization.upsert({
    where: { mspId: 'Org3MSP' },
    update: {},
    create: {
      nome: 'Universidade Estadual de Campinas',
      mspId: 'Org3MSP',
      peerEndpoint: 'peer0.org3.example.com:7051',
      peerName: 'peer0.org3.example.com',
      status: OrganizationStatus.INATIVA,
    },
  });

  console.log(`  ✓ ${orgAtiva.nome} (ATIVA)`);
  console.log(`  ✓ ${orgPendente.nome} (PENDENTE)`);
  console.log(`  ✓ ${orgInativa.nome} (INATIVA)`);

  console.log('\n👤 Creating Admin User...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'admin@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Administrador do Sistema',
      role: Role.ADMIN,
      organizationId: orgAtiva.id,
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
      organizationId: orgAtiva.id,
    },
  });

  const coordinator1 = await prisma.coordinator.upsert({
    where: { userId: coordUser1.id },
    update: {},
    create: {
      userId: coordUser1.id,
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
      organizationId: orgAtiva.id,
    },
  });

  const coordinator2 = await prisma.coordinator.upsert({
    where: { userId: coordUser2.id },
    update: {},
    create: {
      userId: coordUser2.id,
    },
  });

  console.log(`  ✓ ${coordUser1.email}`);
  console.log(`  ✓ ${coordUser2.email}`);

  console.log('\n🏛️  Creating Departments...');

  const deptInformatica = await prisma.department.upsert({
    where: { name: 'Instituto de Informática' },
    update: {},
    create: {
      name: 'Instituto de Informática',
    },
  });

  const deptEngenharia = await prisma.department.upsert({
    where: { name: 'Escola de Engenharia' },
    update: {},
    create: {
      name: 'Escola de Engenharia',
    },
  });

  const deptMatematica = await prisma.department.upsert({
    where: { name: 'Instituto de Matemática' },
    update: {},
    create: {
      name: 'Instituto de Matemática',
    },
  });

  console.log(`  ✓ ${deptInformatica.name}`);
  console.log(`  ✓ ${deptEngenharia.name}`);
  console.log(`  ✓ ${deptMatematica.name}`);

  console.log('\n📚 Creating Courses...');

  const courseCC = await prisma.course.upsert({
    where: { codigo: 'CC-UFRGS' },
    update: {},
    create: {
      nome: 'Ciência da Computação',
      codigo: 'CC-UFRGS',
      departmentId: deptInformatica.id,
      ativo: true,
      coordinatorId: coordinator1.id,
    },
  });

  const courseSI = await prisma.course.upsert({
    where: { codigo: 'SI-UFRGS' },
    update: {},
    create: {
      nome: 'Sistemas de Informação',
      codigo: 'SI-UFRGS',
      departmentId: deptInformatica.id,
      ativo: true,
      coordinatorId: coordinator2.id,
    },
  });

  const courseInativo = await prisma.course.upsert({
    where: { codigo: 'EC-UFRGS' },
    update: {},
    create: {
      nome: 'Engenharia de Computação',
      codigo: 'EC-UFRGS',
      departmentId: deptEngenharia.id,
      ativo: false,
    },
  });

  console.log(`  ✓ ${courseCC.nome} (ativo)`);
  console.log(`  ✓ ${courseSI.nome} (ativo)`);
  console.log(`  ✓ ${courseInativo.nome} (inativo)`);

  console.log('\n👨‍🏫 Creating Advisors...');

  const advisorUser1 = await prisma.user.upsert({
    where: { email: 'orientador1@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'orientador1@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Prof. Dr. João Pedro Oliveira',
      role: Role.ADVISOR,
      organizationId: orgAtiva.id,
    },
  });

  const advisor1 = await prisma.advisor.upsert({
    where: { userId: advisorUser1.id },
    update: {},
    create: {
      userId: advisorUser1.id,
      departmentId: deptInformatica.id,
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
      organizationId: orgAtiva.id,
    },
  });

  const advisor2 = await prisma.advisor.upsert({
    where: { userId: advisorUser2.id },
    update: {},
    create: {
      userId: advisorUser2.id,
      departmentId: deptInformatica.id,
      courseId: courseSI.id,
    },
  });

  console.log(`  ✓ ${advisorUser1.email}`);
  console.log(`  ✓ ${advisorUser2.email}`);

  console.log('\n🎒 Creating Students...');

  const studentUser1 = await prisma.user.upsert({
    where: { email: 'aluno1@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno1@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Lucas Silva Pereira',
      role: Role.STUDENT,
      organizationId: orgAtiva.id,
    },
  });

  const student1 = await prisma.student.upsert({
    where: { registration: '00123456' },
    update: {},
    create: {
      registration: '00123456',
      userId: studentUser1.id,
      courseId: courseCC.id,
    },
  });

  const studentUser2 = await prisma.user.upsert({
    where: { email: 'aluno2@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno2@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Mariana Costa Ferreira',
      role: Role.STUDENT,
      organizationId: orgAtiva.id,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { registration: '00234567' },
    update: {},
    create: {
      registration: '00234567',
      userId: studentUser2.id,
      courseId: courseSI.id,
    },
  });

  const studentUser3 = await prisma.user.upsert({
    where: { email: 'aluno3@ufrgs.edu.br' },
    update: {},
    create: {
      email: 'aluno3@ufrgs.edu.br',
      password: defaultPassword,
      name: 'Pedro Henrique Souza',
      role: Role.STUDENT,
      organizationId: orgAtiva.id,
    },
  });

  const student3 = await prisma.student.upsert({
    where: { registration: '00345678' },
    update: {},
    create: {
      registration: '00345678',
      userId: studentUser3.id,
      courseId: courseCC.id,
    },
  });

  console.log(`  ✓ ${studentUser1.email} (${student1.registration})`);
  console.log(`  ✓ ${studentUser2.email} (${student2.registration})`);
  console.log(`  ✓ ${studentUser3.email} (${student3.registration})`);

  console.log('\n📝 Creating Defenses...');

  const defenseAprovada = await prisma.defense.upsert({
    where: { id: 'defense-aprovada' },
    update: {},
    create: {
      id: 'defense-aprovada',
      title: 'Sistema Distribuído para Gerenciamento de Documentos Acadêmicos usando Blockchain',
      defenseDate: new Date('2024-12-15T14:00:00Z'),
      finalGrade: 9.5,
      result: DefenseResult.APPROVED,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student1.id,
        },
      },
    },
  });

  const defenseReprovada = await prisma.defense.upsert({
    where: { id: 'defense-reprovada' },
    update: {},
    create: {
      id: 'defense-reprovada',
      title: 'Análise de Algoritmos de Machine Learning para Detecção de Fraudes',
      defenseDate: new Date('2024-11-20T10:00:00Z'),
      finalGrade: 4.0,
      result: DefenseResult.FAILED,
      advisorId: advisor2.id,
      students: {
        create: {
          studentId: student2.id,
        },
      },
    },
  });

  const defensePendente = await prisma.defense.upsert({
    where: { id: 'defense-pendente' },
    update: {},
    create: {
      id: 'defense-pendente',
      title: 'Desenvolvimento de API RESTful com Arquitetura Hexagonal',
      defenseDate: new Date('2025-02-10T09:00:00Z'),
      result: DefenseResult.PENDING,
      advisorId: advisor1.id,
      students: {
        create: {
          studentId: student3.id,
        },
      },
    },
  });

  console.log(`  ✓ "${defenseAprovada.title.substring(0, 50)}..." (APROVADO)`);
  console.log(`  ✓ "${defenseReprovada.title.substring(0, 50)}..." (REPROVADO)`);
  console.log(`  ✓ "${defensePendente.title.substring(0, 50)}..." (PENDENTE)`);

  console.log('\n📄 Creating Documents...');

  const docHash1 = crypto.createHash('sha256').update('ata-defense-1-v1').digest('hex');
  const docAta = await prisma.document.upsert({
    where: { id: 'doc-ata-1' },
    update: {},
    create: {
      id: 'doc-ata-1',
      tipo: DocumentType.ATA,
      versao: 1,
      documentoHash: docHash1,
      arquivoPath: '/documents/atas/ata-defense-1-v1.pdf',
      status: DocumentStatus.APROVADO,
      defenseId: defenseAprovada.id,
      blockchainTxId: 'tx_abc123def456',
      blockchainRegisteredAt: new Date('2024-12-16T10:00:00Z'),
    },
  });

  const docHash2 = crypto.createHash('sha256').update('ficha-defense-1-v1').digest('hex');
  const docFicha = await prisma.document.upsert({
    where: { id: 'doc-ficha-1' },
    update: {},
    create: {
      id: 'doc-ficha-1',
      tipo: DocumentType.FICHA,
      versao: 1,
      documentoHash: docHash2,
      arquivoPath: '/documents/fichas/ficha-defense-1-v1.pdf',
      status: DocumentStatus.APROVADO,
      defenseId: defenseAprovada.id,
      blockchainTxId: 'tx_xyz789ghi012',
      blockchainRegisteredAt: new Date('2024-12-16T10:05:00Z'),
    },
  });

  const docHash3 = crypto.createHash('sha256').update('ata-defense-3-v1').digest('hex');
  const docPendente = await prisma.document.upsert({
    where: { id: 'doc-ata-pendente' },
    update: {},
    create: {
      id: 'doc-ata-pendente',
      tipo: DocumentType.ATA,
      versao: 1,
      documentoHash: docHash3,
      arquivoPath: '/documents/atas/ata-defense-3-v1.pdf',
      status: DocumentStatus.PENDENTE,
      defenseId: defensePendente.id,
    },
  });

  const docHash4 = crypto.createHash('sha256').update('ata-defense-2-v1-inativo').digest('hex');
  const docInativo = await prisma.document.upsert({
    where: { id: 'doc-ata-inativo' },
    update: {},
    create: {
      id: 'doc-ata-inativo',
      tipo: DocumentType.ATA,
      versao: 1,
      documentoHash: docHash4,
      arquivoPath: '/documents/atas/ata-defense-2-v1.pdf',
      status: DocumentStatus.INATIVO,
      motivoInativacao: 'Documento substituído por nova versão corrigida',
      dataInativacao: new Date('2024-11-25T15:00:00Z'),
      defenseId: defenseReprovada.id,
    },
  });

  console.log(`  ✓ ATA - Defense 1 (APROVADO, na blockchain)`);
  console.log(`  ✓ FICHA - Defense 1 (APROVADO, na blockchain)`);
  console.log(`  ✓ ATA - Defense 3 (PENDENTE)`);
  console.log(`  ✓ ATA - Defense 2 (INATIVO)`);

  console.log('\n✅ Creating Approvals...');

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docAta.id, role: ApprovalRole.ORIENTADOR } },
    update: {},
    create: {
      documentId: docAta.id,
      role: ApprovalRole.ORIENTADOR,
      status: ApprovalStatus.APROVADO,
      approverId: advisorUser1.id,
      approvedAt: new Date('2024-12-15T16:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docAta.id, role: ApprovalRole.COORDENADOR } },
    update: {},
    create: {
      documentId: docAta.id,
      role: ApprovalRole.COORDENADOR,
      status: ApprovalStatus.APROVADO,
      approverId: coordUser1.id,
      approvedAt: new Date('2024-12-16T09:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docAta.id, role: ApprovalRole.ALUNO } },
    update: {},
    create: {
      documentId: docAta.id,
      role: ApprovalRole.ALUNO,
      status: ApprovalStatus.APROVADO,
      approverId: studentUser1.id,
      approvedAt: new Date('2024-12-15T17:00:00Z'),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docPendente.id, role: ApprovalRole.ORIENTADOR } },
    update: {},
    create: {
      documentId: docPendente.id,
      role: ApprovalRole.ORIENTADOR,
      status: ApprovalStatus.PENDENTE,
      code: '123456',
      codeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docPendente.id, role: ApprovalRole.COORDENADOR } },
    update: {},
    create: {
      documentId: docPendente.id,
      role: ApprovalRole.COORDENADOR,
      status: ApprovalStatus.PENDENTE,
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docPendente.id, role: ApprovalRole.ALUNO } },
    update: {},
    create: {
      documentId: docPendente.id,
      role: ApprovalRole.ALUNO,
      status: ApprovalStatus.PENDENTE,
    },
  });

  await prisma.approval.upsert({
    where: { documentId_role: { documentId: docInativo.id, role: ApprovalRole.COORDENADOR } },
    update: {},
    create: {
      documentId: docInativo.id,
      role: ApprovalRole.COORDENADOR,
      status: ApprovalStatus.REJEITADO,
      justificativa: 'Documento contém erros de formatação e informações incorretas',
      approverId: coordUser2.id,
    },
  });

  console.log(`  ✓ 3 aprovações para ATA Defense 1 (todas APROVADO)`);
  console.log(`  ✓ 3 aprovações para ATA Defense 3 (todas PENDENTE)`);
  console.log(`  ✓ 1 aprovação para ATA Defense 2 (REJEITADO)`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed completed successfully!');
  console.log('='.repeat(50));
  console.log('\n📋 Credentials (password: 123456):');
  console.log('─'.repeat(50));
  console.log(`  ADMIN:       ${admin.email}`);
  console.log(`  COORDINATOR: ${coordUser1.email}`);
  console.log(`  COORDINATOR: ${coordUser2.email}`);
  console.log(`  ADVISOR:     ${advisorUser1.email}`);
  console.log(`  ADVISOR:     ${advisorUser2.email}`);
  console.log(`  STUDENT:     ${studentUser1.email}`);
  console.log(`  STUDENT:     ${studentUser2.email}`);
  console.log(`  STUDENT:     ${studentUser3.email}`);
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
