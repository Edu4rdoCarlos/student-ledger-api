import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma';
import { CreateCoordinatorUseCase } from '../src/core/modules/coordinators/application/use-cases';
import { CreateAdvisorUseCase } from '../src/core/modules/advisors/application/use-cases';
import { CreateStudentUseCase } from '../src/core/modules/students/application/use-cases';
import { Role, DefenseResult, DefenseStatus, DocumentStatus, ApprovalRole, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import Redis from 'ioredis';

async function seedWithCertificates() {
  console.log('🌱 Seeding database with Fabric CA certificates...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const createCoordinator = app.get(CreateCoordinatorUseCase);
  const createAdvisor = app.get(CreateAdvisorUseCase);
  const createStudent = app.get(CreateStudentUseCase);

  const defaultPassword = await bcrypt.hash('Admin123!', 10);

  try {
    // =====================================================
    // 0. CLEAN UP - Remove existing data and pending jobs
    // =====================================================
    console.log('🧹 Cleaning up existing data and pending jobs...');

    // Clean Bull Queue first to avoid processing old jobs
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    const queueKeys = await redis.keys('bull:certificate-generation:*');
    if (queueKeys.length > 0) {
      await redis.del(...queueKeys);
    }
    await redis.quit();
    console.log('  ✓ Queue cleaned');

    await prisma.approval.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.defenseEvent.deleteMany({});
    await prisma.defenseStudent.deleteMany({});
    await prisma.examBoardMember.deleteMany({});
    await prisma.defense.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.advisor.deleteMany({});
    await prisma.coordinator.deleteMany({});
    await prisma.userCertificate.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.course.deleteMany({});

    console.log('  ✓ Database cleaned');

    // =====================================================
    // 1. ADMIN - Direto no banco (não precisa de certificado)
    // =====================================================
    console.log('\n👤 Creating Admin User (no certificate needed)...');

    const admin = await prisma.user.create({
      data: {
        email: 'admin@academico.example.com',
        password: defaultPassword,
        name: 'Administrador do Sistema',
        role: Role.ADMIN,
      },
    });
    console.log(`  ✓ ${admin.email}`);

    // Admin as current user for creating other users
    const adminCurrentUser = { id: admin.id, email: admin.email, role: admin.role };

    // =====================================================
    // 2. CURSOS - Direto no banco (não precisa de certificado)
    // =====================================================
    console.log('\n📚 Creating Courses...');

    const courseCC = await prisma.course.create({
      data: {
        name: 'Ciência da Computação',
        code: 'CC-IES',
        active: true,
      },
    });

    const courseSI = await prisma.course.create({
      data: {
        name: 'Sistemas de Informação',
        code: 'SI-IES',
        active: true,
      },
    });

    const courseES = await prisma.course.create({
      data: {
        name: 'Engenharia de Software',
        code: 'ES-IES',
        active: true,
      },
    });

    const courseInativo = await prisma.course.create({
      data: {
        name: 'Engenharia de Computação',
        code: 'EC-IES',
        active: false,
      },
    });

    console.log(`  ✓ ${courseCC.name} (ativo)`);
    console.log(`  ✓ ${courseSI.name} (ativo)`);
    console.log(`  ✓ ${courseES.name} (ativo)`);
    console.log(`  ✓ ${courseInativo.name} (inativo)`);

    // =====================================================
    // 3. COORDINATORS - Via UseCase (gera certificado)
    // =====================================================
    console.log('\n🎓 Creating Coordinators (with certificates)...');

    const coordinator1 = await createCoordinator.execute({
      email: 'coordenador.cc@academico.example.com',
      name: 'Nick Fury',
      courseId: courseCC.id,
    });
    console.log(`  ✓ ${coordinator1.email} - Certificate queued`);

    const coordinator2 = await createCoordinator.execute({
      email: 'coordenador.si@academico.example.com',
      name: 'Amanda Waller',
      courseId: courseSI.id,
    });
    console.log(`  ✓ ${coordinator2.email} - Certificate queued`);

    // =====================================================
    // 4. ADVISORS - Via UseCase (gera certificado)
    // =====================================================
    console.log('\n👨‍🏫 Creating Advisors (with certificates)...');

    const advisor1 = await createAdvisor.execute({
      email: 'orientador1@academico.example.com',
      name: 'Tony Stark',
      specialization: 'Sistemas Distribuídos e Blockchain',
      courseId: courseCC.id,
    }, adminCurrentUser);
    console.log(`  ✓ ${advisor1.email} - Certificate queued`);

    const advisor2 = await createAdvisor.execute({
      email: 'orientador2@academico.example.com',
      name: 'Diana Prince',
      specialization: 'Inteligência Artificial e Machine Learning',
      courseId: courseSI.id,
    }, adminCurrentUser);
    console.log(`  ✓ ${advisor2.email} - Certificate queued`);

    // Coordenador 1 também como orientador
    const coordUser1ForAdvisor = await prisma.user.findUnique({ where: { email: 'coordenador.cc@academico.example.com' } });
    await prisma.advisor.create({
      data: {
        id: coordUser1ForAdvisor!.id,
        specialization: 'Arquitetura de Software e Cloud Computing',
        courseId: courseCC.id,
      },
    });
    console.log(`  ✓ ${coordinator1.email} (também atua como orientador)`);

    // =====================================================
    // 5. STUDENTS - Via UseCase (gera certificado)
    // =====================================================
    console.log('\n🎒 Creating Students (with certificates)...');

    const studentsData = [
      { email: 'aluno1@academico.example.com', name: 'Peter Parker', registration: '00123456', courseId: courseCC.id, desc: 'TCC Aprovado' },
      { email: 'aluno2@academico.example.com', name: 'Gwen Stacy', registration: '00234567', courseId: courseCC.id, desc: 'TCC Reprovado' },
      { email: 'aluno3@academico.example.com', name: 'Miles Morales', registration: '00345678', courseId: courseCC.id, desc: 'TCC Pendente' },
      { email: 'aluno4@academico.example.com', name: 'Mary Jane Watson', registration: '00456789', courseId: courseCC.id, desc: 'Sem TCC' },
      { email: 'aluno5@academico.example.com', name: 'Dick Grayson', registration: '00567890', courseId: courseCC.id, desc: 'TCC em Dupla' },
      { email: 'aluno6@academico.example.com', name: 'Barbara Gordon', registration: '00678901', courseId: courseCC.id, desc: 'TCC em Dupla' },
      { email: 'aluno7@academico.example.com', name: 'Tim Drake', registration: '00789012', courseId: courseSI.id, desc: 'TCC sob Aprovação' },
      { email: 'aluno8@academico.example.com', name: 'Wanda Maximoff', registration: '00890123', courseId: courseCC.id, desc: 'TCC Cancelado' },
      { email: 'aluno9@academico.example.com', name: 'Pietro Maximoff', registration: '00901234', courseId: courseCC.id, desc: 'TCC Nota Mínima' },
      { email: 'aluno10@academico.example.com', name: 'Kamala Khan', registration: '01012345', courseId: courseCC.id, desc: 'TCC Versão Ajustada' },
      { email: 'aluno11@academico.example.com', name: 'Damian Wayne', registration: '01123456', courseId: courseCC.id, desc: 'Múltiplas Defesas' },
      { email: 'aluno12@academico.example.com', name: 'Natasha Romanoff', registration: '01234567', courseId: courseCC.id, desc: 'Aguardando Aprovações' },
      { email: 'carlos.eduardo@academico.example.com', name: 'Clark Kent', registration: '02345678', courseId: courseCC.id, desc: 'Aluno Aprovou, Orientador Rejeitou' },
    ];

    for (const studentData of studentsData) {
      const student = await createStudent.execute({
        email: studentData.email,
        name: studentData.name,
        registration: studentData.registration,
        courseId: studentData.courseId,
      });
      console.log(`  ✓ ${student.email} (${studentData.registration}) - ${studentData.desc}`);
    }

    // =====================================================
    // 6. FIX PASSWORDS - Definir Admin123! para todos
    // =====================================================
    console.log('\n🔐 Setting fixed password (Admin123!) for all users...');

    await prisma.user.updateMany({
      data: { password: defaultPassword },
    });

    const totalUsers = await prisma.user.count();
    console.log(`  ✓ ${totalUsers} users updated with password: Admin123!`);

    // =====================================================
    // 7. DEFESAS - Criadas diretamente no banco
    // =====================================================
    console.log('\n📝 Creating Defenses...');

    // Buscar IDs dos usuários criados
    const coordUser1 = await prisma.user.findUnique({ where: { email: 'coordenador.cc@academico.example.com' } });
    const coordUser2 = await prisma.user.findUnique({ where: { email: 'coordenador.si@academico.example.com' } });
    const advisorUser1 = await prisma.user.findUnique({ where: { email: 'orientador1@academico.example.com' } });
    const advisorUser2 = await prisma.user.findUnique({ where: { email: 'orientador2@academico.example.com' } });
    const studentUser1 = await prisma.user.findUnique({ where: { email: 'aluno1@academico.example.com' } });
    const studentUser2 = await prisma.user.findUnique({ where: { email: 'aluno2@academico.example.com' } });
    const studentUser3 = await prisma.user.findUnique({ where: { email: 'aluno3@academico.example.com' } });
    const studentUser5 = await prisma.user.findUnique({ where: { email: 'aluno5@academico.example.com' } });
    const studentUser6 = await prisma.user.findUnique({ where: { email: 'aluno6@academico.example.com' } });
    const studentUser7 = await prisma.user.findUnique({ where: { email: 'aluno7@academico.example.com' } });
    const studentUser8 = await prisma.user.findUnique({ where: { email: 'aluno8@academico.example.com' } });
    const studentUser9 = await prisma.user.findUnique({ where: { email: 'aluno9@academico.example.com' } });
    const studentUser10 = await prisma.user.findUnique({ where: { email: 'aluno10@academico.example.com' } });
    const studentUser11 = await prisma.user.findUnique({ where: { email: 'aluno11@academico.example.com' } });
    const studentUser12 = await prisma.user.findUnique({ where: { email: 'aluno12@academico.example.com' } });
    const studentCarlosEduardo = await prisma.user.findUnique({ where: { email: 'carlos.eduardo@academico.example.com' } });

    // Defesa 1: Aprovada - aluno1
    const defenseAprovada = await prisma.defense.create({
      data: {
        id: 'defense-aprovada',
        title: 'Sistema Distribuído para Gerenciamento de Documentos Acadêmicos usando Blockchain',
        defenseDate: new Date('2024-12-15T14:00:00Z'),
        location: 'Sala 301 - Prédio da Computação',
        finalGrade: 9.5,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser1!.id } },
        examBoard: {
          create: [
            { name: 'Charles Xavier', email: 'charles.xavier@academico.example.com' },
            { name: 'Jean Grey', email: 'jean.grey@academico.example.com' },
            { name: 'Scott Summers', email: 'scott.summers@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseAprovada.title.substring(0, 50)}..." (APROVADO)`);

    // Defesa 2: Reprovada - aluno2
    const defenseReprovada = await prisma.defense.create({
      data: {
        id: 'defense-reprovada',
        title: 'Análise de Algoritmos de Machine Learning para Detecção de Fraudes',
        defenseDate: new Date('2024-11-20T10:00:00Z'),
        location: 'Auditório Central',
        finalGrade: 4.0,
        result: DefenseResult.FAILED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser2!.id } },
        examBoard: {
          create: [
            { name: 'Bruce Banner', email: 'bruce.banner@academico.example.com' },
            { name: 'Carol Danvers', email: 'carol.danvers@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseReprovada.title.substring(0, 50)}..." (REPROVADO)`);

    // Defesa 3: Pendente - aluno3
    const defensePendente = await prisma.defense.create({
      data: {
        id: 'defense-pendente',
        title: 'Desenvolvimento de API RESTful com Arquitetura Hexagonal',
        defenseDate: new Date('2025-02-10T09:00:00Z'),
        location: 'Sala 205 - Bloco IV',
        result: DefenseResult.PENDING,
        status: DefenseStatus.SCHEDULED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser3!.id } },
        examBoard: {
          create: [
            { name: 'Stephen Strange', email: 'stephen.strange@academico.example.com' },
            { name: 'Reed Richards', email: 'reed.richards@academico.example.com' },
            { name: 'Sue Storm', email: 'sue.storm@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defensePendente.title.substring(0, 50)}..." (PENDENTE)`);

    // Defesa 4: TCC em dupla - aprovado (aluno5 e aluno6)
    const defenseDupla = await prisma.defense.create({
      data: {
        id: 'defense-dupla',
        title: 'Plataforma de E-Learning com Gamificação e IA',
        defenseDate: new Date('2024-10-25T15:00:00Z'),
        location: 'Auditório 2 - Prédio da Computação',
        finalGrade: 8.0,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: {
          create: [
            { studentId: studentUser5!.id },
            { studentId: studentUser6!.id },
          ],
        },
        examBoard: {
          create: [
            { name: 'Victor Stone', email: 'victor.stone@academico.example.com' },
            { name: 'Dinah Lance', email: 'dinah.lance@academico.example.com' },
            { name: 'Barry Allen', email: 'barry.allen@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseDupla.title.substring(0, 50)}..." (DUPLA APROVADA)`);

    // Defesa 5: Com aprovações parciais - aluno7
    const defenseAprovacaoParcial = await prisma.defense.create({
      data: {
        id: 'defense-aprovacao-parcial',
        title: 'Sistema de Recomendação Baseado em Redes Neurais',
        defenseDate: new Date('2024-12-10T10:30:00Z'),
        location: 'Sala 102 - Bloco III',
        finalGrade: 8.5,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser2!.id,
        students: { create: { studentId: studentUser7!.id } },
        examBoard: {
          create: [
            { name: 'Hal Jordan', email: 'hal.jordan@academico.example.com' },
            { name: 'Zatanna Zatara', email: 'zatanna.zatara@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseAprovacaoParcial.title.substring(0, 50)}..." (APROVAÇÃO PARCIAL)`);

    // Defesa 6: Cancelada - aluno8
    const defenseCancelada = await prisma.defense.create({
      data: {
        id: 'defense-cancelada',
        title: 'Análise de Performance em Aplicações Web Modernas',
        defenseDate: new Date('2024-09-15T14:00:00Z'),
        location: 'Sala 203 - Prédio Central',
        finalGrade: 0,
        result: DefenseResult.FAILED,
        status: DefenseStatus.CANCELED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser8!.id } },
        examBoard: {
          create: [{ name: 'Arthur Curry', email: 'arthur.curry@academico.example.com' }],
        },
      },
    });
    console.log(`  ✓ "${defenseCancelada.title.substring(0, 50)}..." (CANCELADA)`);

    await prisma.defenseEvent.create({
      data: {
        id: 'event-defense-cancelada',
        defenseId: defenseCancelada.id,
        type: 'CANCELED',
        reason: 'Estudante solicitou trancamento de matrícula',
      },
    });

    // Defesa 7: Aprovada no limite (nota 7.0) - aluno9
    const defenseNotaMinima = await prisma.defense.create({
      data: {
        id: 'defense-nota-minima',
        title: 'Otimização de Consultas SQL em Bancos Relacionais',
        defenseDate: new Date('2024-08-30T11:00:00Z'),
        location: 'Sala 404 - Bloco V',
        finalGrade: 7.0,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser9!.id } },
        examBoard: {
          create: [
            { name: 'Oliver Queen', email: 'oliver.queen@academico.example.com' },
            { name: 'Selina Kyle', email: 'selina.kyle@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseNotaMinima.title.substring(0, 50)}..." (NOTA MÍNIMA)`);

    // Defesa 8: Com documento rejeitado e versão ajustada - aluno10
    const defenseVersaoAjustada = await prisma.defense.create({
      data: {
        id: 'defense-versao-ajustada',
        title: 'Implementação de Microsserviços com Docker e Kubernetes',
        defenseDate: new Date('2024-07-18T16:00:00Z'),
        location: 'Auditório 1 - Prédio da Engenharia',
        finalGrade: 8.5,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser10!.id } },
        examBoard: {
          create: [
            { name: 'Hank Pym', email: 'hank.pym@academico.example.com' },
            { name: 'Janet Van Dyne', email: 'janet.vandyne@academico.example.com' },
            { name: "T'Challa", email: 'tchalla@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseVersaoAjustada.title.substring(0, 50)}..." (VERSÃO AJUSTADA)`);

    // Defesa 9: Aguardando aprovações iniciais - aluno12
    const defenseAguardandoAprovacoes = await prisma.defense.create({
      data: {
        id: 'defense-aguardando-aprovacoes',
        title: 'Aplicação Mobile para Gestão de Tarefas com Sincronização Cloud',
        defenseDate: new Date('2024-12-18T14:00:00Z'),
        location: 'Sala 103 - Bloco II',
        finalGrade: 8.0,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentUser12!.id } },
        examBoard: {
          create: [
            { name: 'Clint Barton', email: 'clint.barton@academico.example.com' },
            { name: 'Shuri', email: 'shuri@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseAguardandoAprovacoes.title.substring(0, 50)}..." (AGUARDANDO APROVAÇÕES)`);

    // Defesa 10: Carlos Eduardo como orientador - aluno11
    const defenseCarlosEduardo = await prisma.defense.create({
      data: {
        id: 'defense-carlos-eduardo',
        title: 'Sistema de Monitoramento de Infraestrutura com Observabilidade',
        defenseDate: new Date('2025-01-10T10:00:00Z'),
        location: 'Sala 305 - Prédio da Computação',
        finalGrade: 8.5,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: coordUser1!.id, // Coordenador como orientador
        students: { create: { studentId: studentUser11!.id } },
        examBoard: {
          create: [
            { name: 'Steve Rogers', email: 'steve.rogers@academico.example.com' },
            { name: 'Sharon Carter', email: 'sharon.carter@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseCarlosEduardo.title.substring(0, 50)}..." (CARLOS EDUARDO ORIENTADOR)`);

    // Defesa 11: Carlos Eduardo como estudante
    const defenseCarlosEstudante = await prisma.defense.create({
      data: {
        id: 'defense-carlos-estudante',
        title: 'Plataforma de Gestão Acadêmica com Blockchain',
        defenseDate: new Date('2025-01-05T14:00:00Z'),
        location: 'Sala 201 - Prédio da Computação',
        finalGrade: 7.5,
        result: DefenseResult.APPROVED,
        status: DefenseStatus.COMPLETED,
        advisorId: advisorUser1!.id,
        students: { create: { studentId: studentCarlosEduardo!.id } },
        examBoard: {
          create: [
            { name: 'Sam Wilson', email: 'sam.wilson@academico.example.com' },
            { name: 'Hope Van Dyne', email: 'hope.vandyne@academico.example.com' },
            { name: 'Bucky Barnes', email: 'bucky.barnes@academico.example.com' },
          ],
        },
      },
    });
    console.log(`  ✓ "${defenseCarlosEstudante.title.substring(0, 50)}..." (CARLOS ESTUDANTE - ORIENTADOR REJEITOU)`);

    // =====================================================
    // 8. DOCUMENTOS - Criados diretamente no banco
    // =====================================================
    console.log('\n📄 Creating Documents...');

    // Documento 1: ATA aprovada - defesa1
    const docHash1 = crypto.createHash('sha256').update('ata-defense-1-v1').digest('hex');
    const evalHash1 = crypto.createHash('sha256').update('avaliacao-defense-1-v1').digest('hex');
    const docAta1 = await prisma.document.create({
      data: {
        id: 'doc-ata-1',
        version: 1,
        minutesHash: docHash1,
        minutesCid: 'QmAta1MinutesCid123456789',
        evaluationHash: evalHash1,
        evaluationCid: 'QmAta1EvaluationCid123456789',
        status: DocumentStatus.APPROVED,
        defenseId: defenseAprovada.id,
        blockchainTxId: 'tx_abc123def456',
        blockchainRegisteredAt: new Date('2024-12-16T10:00:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense 1 (APROVADO, na blockchain)`);

    // Documento 2: ATA reprovada - defesa2
    const docHash2 = crypto.createHash('sha256').update('ata-defense-2-v1').digest('hex');
    const evalHash2 = crypto.createHash('sha256').update('avaliacao-defense-2-v1').digest('hex');
    const docReprovada = await prisma.document.create({
      data: {
        id: 'doc-ata-reprovada',
        version: 1,
        minutesHash: docHash2,
        minutesCid: 'QmReprovadaMinutesCid123456789',
        evaluationHash: evalHash2,
        evaluationCid: 'QmReprovadaEvaluationCid123456789',
        status: DocumentStatus.APPROVED,
        defenseId: defenseReprovada.id,
        blockchainTxId: 'tx_reprovada456xyz',
        blockchainRegisteredAt: new Date('2024-11-21T11:00:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense Reprovada (APROVADO, na blockchain)`);

    // Documento 4: ATA dupla aprovada - defesa4
    const docHash4 = crypto.createHash('sha256').update('ata-defense-dupla-v1').digest('hex');
    const evalHash4 = crypto.createHash('sha256').update('avaliacao-defense-dupla-v1').digest('hex');
    const docDupla = await prisma.document.create({
      data: {
        id: 'doc-ata-dupla',
        version: 1,
        minutesHash: docHash4,
        minutesCid: 'QmDuplaMinutesCid123456789',
        evaluationHash: evalHash4,
        evaluationCid: 'QmDuplaEvaluationCid123456789',
        status: DocumentStatus.APPROVED,
        defenseId: defenseDupla.id,
        blockchainTxId: 'tx_dupla456xyz789',
        blockchainRegisteredAt: new Date('2024-10-26T09:00:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense Dupla (APROVADO, na blockchain)`);

    // Documento 5: ATA com aprovações parciais - defesa5
    const docHash5 = crypto.createHash('sha256').update('ata-defense-parcial-v1').digest('hex');
    const evalHash5 = crypto.createHash('sha256').update('avaliacao-defense-parcial-v1').digest('hex');
    const docParcial = await prisma.document.create({
      data: {
        id: 'doc-ata-parcial',
        version: 1,
        minutesHash: docHash5,
        minutesCid: 'QmParcialMinutesCid123456789',
        evaluationHash: evalHash5,
        evaluationCid: 'QmParcialEvaluationCid123456789',
        status: DocumentStatus.PENDING,
        defenseId: defenseAprovacaoParcial.id,
      },
    });
    console.log(`  ✓ ATA - Defense Parcial (PENDENTE - aprovações parciais)`);

    // Documento 6: ATA nota mínima - defesa7
    const docHash6 = crypto.createHash('sha256').update('ata-defense-minima-v1').digest('hex');
    const evalHash6 = crypto.createHash('sha256').update('avaliacao-defense-minima-v1').digest('hex');
    const docNotaMinima = await prisma.document.create({
      data: {
        id: 'doc-ata-minima',
        version: 1,
        minutesHash: docHash6,
        minutesCid: 'QmMinimaMinutesCid123456789',
        evaluationHash: evalHash6,
        evaluationCid: 'QmMinimaEvaluationCid123456789',
        status: DocumentStatus.APPROVED,
        defenseId: defenseNotaMinima.id,
        blockchainTxId: 'tx_minima789abc123',
        blockchainRegisteredAt: new Date('2024-08-31T14:00:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense Nota Mínima (APROVADO, na blockchain)`);

    // Documento 7: Versão ajustada v1 - INATIVA
    const docHash7 = crypto.createHash('sha256').update('ata-defense-ajustada-v1').digest('hex');
    const evalHash7 = crypto.createHash('sha256').update('avaliacao-defense-ajustada-v1').digest('hex');
    const docAjustadaV1 = await prisma.document.create({
      data: {
        id: 'doc-ata-ajustada-v1',
        version: 1,
        minutesHash: docHash7,
        minutesCid: 'QmAjustadaV1MinutesCid123456789',
        evaluationHash: evalHash7,
        evaluationCid: 'QmAjustadaV1EvaluationCid123456789',
        status: DocumentStatus.INACTIVE,
        inactivationReason: 'Nova versão criada: Correção de formatação e atualização dos dados da banca examinadora',
        inactivatedAt: new Date('2024-07-22T16:00:00Z'),
        defenseId: defenseVersaoAjustada.id,
        blockchainTxId: 'tx_ajustada111aaa222',
        blockchainRegisteredAt: new Date('2024-07-19T10:00:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense Ajustada v1 (INATIVO - substituído por nova versão)`);

    // Documento 8: Segunda versão aprovada (ativa)
    const docHash8 = crypto.createHash('sha256').update('ata-defense-ajustada-v2-corrigida').digest('hex');
    const evalHash8 = crypto.createHash('sha256').update('avaliacao-defense-ajustada-v2-corrigida').digest('hex');
    const docAjustadaV2 = await prisma.document.create({
      data: {
        id: 'doc-ata-ajustada-v2',
        version: 2,
        minutesHash: docHash8,
        minutesCid: 'QmAjustadaV2MinutesCid123456789',
        evaluationHash: evalHash8,
        evaluationCid: 'QmAjustadaV2EvaluationCid123456789',
        status: DocumentStatus.APPROVED,
        changeReason: 'Correção de formatação e atualização dos dados da banca examinadora',
        previousVersionId: docAjustadaV1.id,
        defenseId: defenseVersaoAjustada.id,
        blockchainTxId: 'tx_ajustada999fff888',
        blockchainRegisteredAt: new Date('2024-07-22T16:30:00Z'),
      },
    });
    console.log(`  ✓ ATA - Defense Ajustada v2 (APROVADO - versão corrigida, na blockchain)`);

    // Documento 9: ATA aguardando aprovações - defesa9
    const docHash9 = crypto.createHash('sha256').update('ata-defense-aguardando-v1').digest('hex');
    const evalHash9 = crypto.createHash('sha256').update('avaliacao-defense-aguardando-v1').digest('hex');
    const docAguardandoAprovacoes = await prisma.document.create({
      data: {
        id: 'doc-ata-aguardando',
        version: 1,
        minutesHash: docHash9,
        minutesCid: 'QmAguardandoMinutesCid123456789',
        evaluationHash: evalHash9,
        evaluationCid: 'QmAguardandoEvaluationCid123456789',
        status: DocumentStatus.PENDING,
        defenseId: defenseAguardandoAprovacoes.id,
      },
    });
    console.log(`  ✓ ATA - Defense Aguardando (PENDENTE - sem aprovações)`);

    // Documento 10: ATA Carlos Eduardo - falta aprovação do coordenador
    const docHash10 = crypto.createHash('sha256').update('ata-defense-carlos-eduardo-v1').digest('hex');
    const evalHash10 = crypto.createHash('sha256').update('avaliacao-defense-carlos-eduardo-v1').digest('hex');
    const docCarlosEduardo = await prisma.document.create({
      data: {
        id: 'doc-ata-carlos-eduardo',
        version: 1,
        minutesHash: docHash10,
        minutesCid: 'QmCarlosEduardoMinutesCid123456789',
        evaluationHash: evalHash10,
        evaluationCid: 'QmCarlosEduardoEvaluationCid123456789',
        status: DocumentStatus.PENDING,
        defenseId: defenseCarlosEduardo.id,
      },
    });
    console.log(`  ✓ ATA - Defense Carlos Eduardo (PENDENTE - falta aprovação do coordenador)`);

    // Documento 11: ATA Carlos Eduardo Estudante - aluno aprovou, orientador rejeitou
    const docHash11 = crypto.createHash('sha256').update('ata-defense-carlos-estudante-v1').digest('hex');
    const evalHash11 = crypto.createHash('sha256').update('avaliacao-defense-carlos-estudante-v1').digest('hex');
    const docCarlosEstudante = await prisma.document.create({
      data: {
        id: 'doc-ata-carlos-estudante',
        version: 1,
        minutesHash: docHash11,
        minutesCid: 'QmCarlosEstudanteMinutesCid123456789',
        evaluationHash: evalHash11,
        evaluationCid: 'QmCarlosEstudanteEvaluationCid123456789',
        status: DocumentStatus.PENDING,
        defenseId: defenseCarlosEstudante.id,
      },
    });
    console.log(`  ✓ ATA - Defense Carlos Eduardo Estudante (PENDENTE - aluno aprovou, orientador rejeitou)`);

    // =====================================================
    // 9. APPROVALS - Criadas diretamente no banco
    // =====================================================
    console.log('\n✅ Creating Approvals...');

    // Aprovações para documento 1 (todas aprovadas)
    await prisma.approval.createMany({
      data: [
        { documentId: docAta1.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser1!.id, approvedAt: new Date('2024-12-15T16:00:00Z') },
        { documentId: docAta1.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.APPROVED, approverId: coordUser1!.id, approvedAt: new Date('2024-12-16T09:00:00Z') },
        { documentId: docAta1.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser1!.id, approvedAt: new Date('2024-12-15T17:00:00Z') },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense 1 (todas APPROVED)`);

    // Aprovações para documento reprovada (todas aprovadas)
    await prisma.approval.createMany({
      data: [
        { documentId: docReprovada.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.APPROVED, approverId: coordUser1!.id, approvedAt: new Date('2024-11-21T10:00:00Z') },
        { documentId: docReprovada.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser1!.id, approvedAt: new Date('2024-11-21T10:15:00Z') },
        { documentId: docReprovada.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser2!.id, approvedAt: new Date('2024-11-21T10:30:00Z') },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Reprovada (todas APPROVED - defesa FAILED)`);

    // Aprovações para documento dupla (todas aprovadas)
    await prisma.approval.createMany({
      data: [
        { documentId: docDupla.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser1!.id, approvedAt: new Date('2024-10-25T17:00:00Z') },
        { documentId: docDupla.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.APPROVED, approverId: coordUser1!.id, approvedAt: new Date('2024-10-26T08:30:00Z') },
        { documentId: docDupla.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser5!.id, approvedAt: new Date('2024-10-25T18:00:00Z') },
        { documentId: docDupla.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser6!.id, approvedAt: new Date('2024-10-25T18:15:00Z') },
      ],
    });
    console.log(`  ✓ 4 aprovações para ATA Defense Dupla (todas APPROVED - TCC em dupla)`);

    // Aprovações para documento parcial (orientador e estudante aprovaram, coordenador pendente)
    await prisma.approval.createMany({
      data: [
        { documentId: docParcial.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser2!.id, approvedAt: new Date('2025-01-12T10:00:00Z') },
        { documentId: docParcial.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser7!.id, approvedAt: new Date('2025-01-12T11:30:00Z') },
        { documentId: docParcial.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.PENDING, approverId: coordUser2!.id },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Parcial (Aluno e Orientador APPROVED, Coordenador PENDING)`);

    // Aprovações para documento nota mínima (todas aprovadas)
    await prisma.approval.createMany({
      data: [
        { documentId: docNotaMinima.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser2!.id, approvedAt: new Date('2024-08-30T13:00:00Z') },
        { documentId: docNotaMinima.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.APPROVED, approverId: coordUser2!.id, approvedAt: new Date('2024-08-31T09:00:00Z') },
        { documentId: docNotaMinima.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser9!.id, approvedAt: new Date('2024-08-30T14:00:00Z') },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Nota Mínima (todas APPROVED)`);

    // Aprovações para documento versão 2 (todas aprovadas)
    await prisma.approval.createMany({
      data: [
        { documentId: docAjustadaV2.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: advisorUser1!.id, approvedAt: new Date('2024-07-22T10:00:00Z') },
        { documentId: docAjustadaV2.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser10!.id, approvedAt: new Date('2024-07-22T11:00:00Z') },
        { documentId: docAjustadaV2.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.APPROVED, approverId: coordUser1!.id, approvedAt: new Date('2024-07-22T15:00:00Z') },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Ajustada v2 (todas APPROVED)`);

    // Aprovações para documento aguardando (estudante aprovou, orientador pendente, coordenador pendente)
    await prisma.approval.createMany({
      data: [
        { documentId: docAguardandoAprovacoes.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser12!.id, approvedAt: new Date('2024-12-18T16:00:00Z') },
        { documentId: docAguardandoAprovacoes.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.PENDING, approverId: advisorUser1!.id },
        { documentId: docAguardandoAprovacoes.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.PENDING, approverId: coordUser1!.id },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Aguardando (Aluno APPROVED, Orientador e Coordenador PENDING)`);

    // Aprovações para documento Carlos Eduardo (aluno e orientador aprovaram, coordenador pendente)
    await prisma.approval.createMany({
      data: [
        { documentId: docCarlosEduardo.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentUser11!.id, approvedAt: new Date('2025-01-10T11:00:00Z') },
        { documentId: docCarlosEduardo.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.APPROVED, approverId: coordUser1!.id, approvedAt: new Date('2025-01-10T12:00:00Z') },
        { documentId: docCarlosEduardo.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.PENDING, approverId: coordUser1!.id },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Carlos Eduardo (Aluno e Orientador APPROVED, Coordenador PENDING)`);

    // Aprovações para documento Carlos Eduardo Estudante (aluno aprovou, orientador rejeitou)
    await prisma.approval.createMany({
      data: [
        { documentId: docCarlosEstudante.id, role: ApprovalRole.STUDENT, status: ApprovalStatus.APPROVED, approverId: studentCarlosEduardo!.id, approvedAt: new Date('2025-01-06T10:00:00Z') },
        { documentId: docCarlosEstudante.id, role: ApprovalRole.ADVISOR, status: ApprovalStatus.REJECTED, approverId: advisorUser1!.id, approvedAt: new Date('2025-01-07T14:30:00Z'), justification: 'A ata apresenta inconsistências nos dados da banca examinadora e a nota final registrada não corresponde à média das avaliações individuais. Por favor, revisar e corrigir antes de prosseguir com as aprovações.' },
        { documentId: docCarlosEstudante.id, role: ApprovalRole.COORDINATOR, status: ApprovalStatus.PENDING, approverId: coordUser1!.id },
      ],
    });
    console.log(`  ✓ 3 aprovações para ATA Defense Carlos Eduardo Estudante (Aluno APPROVED, Orientador REJECTED, Coordenador PENDING)`);

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Seed completed successfully!');
    console.log('='.repeat(60));
    console.log('\n⏳ Certificates are being generated in background via Bull Queue');
    console.log('   Check Redis/Bull dashboard or logs for certificate generation status\n');

    console.log('📋 Credentials (password: Admin123!):');
    console.log('─'.repeat(60));
    console.log(`  ADMIN:       admin@academico.example.com`);
    console.log(`  COORDINATOR: coordenador.cc@academico.example.com`);
    console.log(`  COORDINATOR: coordenador.si@academico.example.com`);
    console.log(`  ADVISOR:     orientador1@academico.example.com`);
    console.log(`  ADVISOR:     orientador2@academico.example.com`);
    for (const s of studentsData) {
      console.log(`  STUDENT:     ${s.email} - ${s.desc}`);
    }
    console.log('─'.repeat(60));

    // Wait for ALL certificates to be generated
    const userCount = await prisma.user.count({ where: { role: { not: Role.ADMIN } } });
    console.log(`\n⏳ Waiting for ${userCount} certificates to be generated...`);

    const maxWaitTime = 180000; // 3 minutes max
    const pollInterval = 2000;
    const startTime = Date.now();

    let certCount = 0;
    while (certCount < userCount && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      certCount = await prisma.userCertificate.count();
      process.stdout.write(`\r  ✓ ${certCount}/${userCount} certificates generated...`);
    }

    console.log(''); // New line

    if (certCount >= userCount) {
      console.log(`\n✅ All ${certCount} certificates generated successfully!`);
    } else {
      console.log(`\n⚠️  Only ${certCount}/${userCount} certificates generated (timeout after 3 minutes)`);
    }

  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await app.close();
  }
}

seedWithCertificates();
