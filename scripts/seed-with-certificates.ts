import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma';
import { CreateCoordinatorUseCase } from '../src/modules/coordinators/application/use-cases';
import { CreateAdvisorUseCase } from '../src/modules/advisors/application/use-cases';
import { CreateStudentUseCase } from '../src/modules/students/application/use-cases';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

    console.log(`  ✓ ${courseCC.name}`);
    console.log(`  ✓ ${courseSI.name}`);
    console.log(`  ✓ ${courseES.name}`);

    // =====================================================
    // 3. COORDINATORS - Via UseCase (gera certificado)
    // =====================================================
    console.log('\n🎓 Creating Coordinators (with certificates)...');

    const coordinator1 = await createCoordinator.execute({
      email: 'coordenador.cc@academico.example.com',
      name: 'Nick Fury',
      courseId: courseCC.code,
    });
    console.log(`  ✓ ${coordinator1.email} - Certificate queued`);

    const coordinator2 = await createCoordinator.execute({
      email: 'coordenador.si@academico.example.com',
      name: 'Amanda Waller',
      courseId: courseSI.code,
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

    // =====================================================
    // 5. STUDENTS - Via UseCase (gera certificado)
    // =====================================================
    console.log('\n🎒 Creating Students (with certificates)...');

    const students = [
      { email: 'aluno1@academico.example.com', name: 'Peter Parker', registration: '00123456', courseId: courseCC.id },
      { email: 'aluno2@academico.example.com', name: 'Gwen Stacy', registration: '00234567', courseId: courseCC.id },
      { email: 'aluno3@academico.example.com', name: 'Miles Morales', registration: '00345678', courseId: courseCC.id },
      { email: 'aluno4@academico.example.com', name: 'Mary Jane Watson', registration: '00456789', courseId: courseCC.id },
      { email: 'aluno5@academico.example.com', name: 'Dick Grayson', registration: '00567890', courseId: courseCC.id },
      { email: 'aluno6@academico.example.com', name: 'Barbara Gordon', registration: '00678901', courseId: courseCC.id },
      { email: 'aluno7@academico.example.com', name: 'Tim Drake', registration: '00789012', courseId: courseSI.id },
      { email: 'aluno8@academico.example.com', name: 'Wanda Maximoff', registration: '00890123', courseId: courseCC.id },
    ];

    for (const studentData of students) {
      const student = await createStudent.execute(studentData);
      console.log(`  ✓ ${student.email} (${studentData.registration}) - Certificate queued`);
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Seed completed successfully!');
    console.log('='.repeat(60));
    console.log('\n⏳ Certificates are being generated in background via Bull Queue');
    console.log('   Check Redis/Bull dashboard or logs for certificate generation status\n');

    console.log('📋 Credentials:');
    console.log('─'.repeat(60));
    console.log('  ADMIN:       admin@academico.example.com');
    console.log('  COORDINATOR: coordenador.cc@academico.example.com');
    console.log('  COORDINATOR: coordenador.si@academico.example.com');
    console.log('  ADVISOR:     orientador1@academico.example.com');
    console.log('  ADVISOR:     orientador2@academico.example.com');
    console.log('  STUDENTS:    aluno1@academico.example.com ... aluno8@academico.example.com');
    console.log('─'.repeat(60));
    console.log('  Password for all: (check email or temporary password)');
    console.log('─'.repeat(60));

    // Wait a bit for certificates to be generated
    console.log('\n⏳ Waiting 15 seconds for certificate generation...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check certificate count
    const certCount = await prisma.userCertificate.count();
    const userCount = await prisma.user.count({ where: { role: { not: Role.ADMIN } } });
    console.log(`\n✅ ${certCount}/${userCount} certificates generated in database`);

    if (certCount < userCount) {
      console.log('⚠️  Some certificates may still be processing in the queue');
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
