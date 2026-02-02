import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma';
import { CertificateManagementService } from '../src/core/toolkit/fabric/application/services/certificate-management.service';
import { SignatureService } from '../src/core/toolkit/fabric/domain/services/signature.service';
import { Role, RevocationReason, ApprovalRole, ApprovalStatus } from '@prisma/client';

async function testCertificateFlow() {
  console.log('🚀 Iniciando teste do fluxo de certificados por approval...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const certificateService = app.get(CertificateManagementService);
  const signatureService = app.get(SignatureService);

  const timestamp = Date.now();
  const coordinatorId = `test-coord-${timestamp}`;
  const advisorId = `test-advisor-${timestamp}`;
  const studentId = `test-student-${timestamp}`;

  try {
    // =====================================================
    // 1. Criar usuários de teste
    // =====================================================
    console.log('📝 Passo 1: Criando usuários de teste...');

    const coordinator = await prisma.user.create({
      data: {
        id: coordinatorId,
        email: `coord-${timestamp}@test.com`,
        name: 'Coordenador Teste',
        password: 'hashed',
        role: Role.COORDINATOR,
      },
    });
    console.log(`  ✓ Coordenador: ${coordinator.email}`);

    const advisor = await prisma.user.create({
      data: {
        id: advisorId,
        email: `advisor-${timestamp}@test.com`,
        name: 'Orientador Teste',
        password: 'hashed',
        role: Role.ADVISOR,
      },
    });
    console.log(`  ✓ Orientador: ${advisor.email}`);

    const student = await prisma.user.create({
      data: {
        id: studentId,
        email: `student-${timestamp}@test.com`,
        name: 'Aluno Teste',
        password: 'hashed',
        role: Role.STUDENT,
      },
    });
    console.log(`  ✓ Aluno: ${student.email}`);

    const course = await prisma.course.create({
      data: {
        name: `Curso Teste ${timestamp}`,
        code: `CT-${timestamp}`,
        active: true,
      },
    });
    console.log(`  ✓ Curso: ${course.name}`);

    await prisma.advisor.create({
      data: {
        id: advisor.id,
        specialization: 'Teste',
        courseId: course.id,
        isActive: true,
      },
    });
    console.log('  ✓ Registro advisor criado');

    await prisma.student.create({
      data: {
        id: student.id,
        registration: `MAT-${timestamp}`,
        courseId: course.id,
      },
    });
    console.log('  ✓ Registro student criado\n');

    // =====================================================
    // 2. Criar defesa e documento de teste (defesa A)
    // =====================================================
    console.log('📝 Passo 2: Criando defesa A, documento e approvals...');

    const defenseA = await prisma.defense.create({
      data: {
        title: `Defesa Teste A - ${timestamp}`,
        advisorId: advisor.id,
        defenseDate: new Date(),
        status: 'COMPLETED',
        result: 'APPROVED',
        finalGrade: 9.0,
        students: {
          create: { studentId: student.id },
        },
      },
    });

    const documentA = await prisma.document.create({
      data: {
        defenseId: defenseA.id,
        version: 1,
        status: 'PENDING',
        minutesHash: 'test-minutes-hash-a',
        minutesCid: 'QmTestMinutesCidA',
        evaluationHash: 'test-eval-hash-a',
        evaluationCid: 'QmTestEvalCidA',
      },
    });

    const approvalAdvisorA = await prisma.approval.create({
      data: {
        documentId: documentA.id,
        role: ApprovalRole.ADVISOR,
        status: ApprovalStatus.PENDING,
        approverId: advisor.id,
      },
    });

    const approvalStudent = await prisma.approval.create({
      data: {
        documentId: documentA.id,
        role: ApprovalRole.STUDENT,
        status: ApprovalStatus.PENDING,
        approverId: student.id,
      },
    });

    console.log(`  ✓ Defesa A: ${defenseA.id}`);
    console.log(`  ✓ Documento A: ${documentA.id}`);
    console.log(`  ✓ Approval orientador (defesa A): ${approvalAdvisorA.id}`);
    console.log(`  ✓ Approval aluno: ${approvalStudent.id}\n`);

    // =====================================================
    // 3. Criar defesa B com outra approval para o mesmo orientador
    // =====================================================
    console.log('📝 Passo 3: Criando defesa B (mesmo orientador)...');

    const defenseB = await prisma.defense.create({
      data: {
        title: `Defesa Teste B - ${timestamp}`,
        advisorId: advisor.id,
        defenseDate: new Date(),
        status: 'COMPLETED',
        result: 'APPROVED',
        finalGrade: 8.5,
        students: {
          create: { studentId: student.id },
        },
      },
    });

    const documentB = await prisma.document.create({
      data: {
        defenseId: defenseB.id,
        version: 1,
        status: 'PENDING',
        minutesHash: 'test-minutes-hash-b',
        minutesCid: 'QmTestMinutesCidB',
        evaluationHash: 'test-eval-hash-b',
        evaluationCid: 'QmTestEvalCidB',
      },
    });

    const approvalAdvisorB = await prisma.approval.create({
      data: {
        documentId: documentB.id,
        role: ApprovalRole.ADVISOR,
        status: ApprovalStatus.PENDING,
        approverId: advisor.id,
      },
    });

    console.log(`  ✓ Defesa B: ${defenseB.id}`);
    console.log(`  ✓ Documento B: ${documentB.id}`);
    console.log(`  ✓ Approval orientador (defesa B): ${approvalAdvisorB.id}\n`);

    // =====================================================
    // 4. Gerar certificado do coordenador (por usuário, sem approvalId)
    // =====================================================
    console.log('📜 Passo 4: Gerando certificado do coordenador (por usuário)...');
    await certificateService.generateUserCertificate(
      coordinator.id,
      coordinator.email,
      Role.COORDINATOR,
    );

    const coordCert = await prisma.userCertificate.findFirst({
      where: { userId: coordinator.id },
    });
    if (!coordCert) throw new Error('Certificado do coordenador não encontrado!');
    console.log(`  ✓ Cert coordenador: ${coordCert.mspId} | approvalId: ${coordCert.approvalId ?? 'null (por usuário)'}`);
    console.log(`  ✓ Status: ${coordCert.status}\n`);

    // =====================================================
    // 5. Gerar certificados por approval (defesa A)
    // =====================================================
    console.log('📜 Passo 5: Gerando certificados por approval (defesa A)...');

    await certificateService.generateUserCertificate(
      advisor.id,
      advisor.email,
      Role.ADVISOR,
      approvalAdvisorA.id,
    );

    const advisorCertA = await prisma.userCertificate.findFirst({
      where: { approvalId: approvalAdvisorA.id },
    });
    if (!advisorCertA) throw new Error('Certificado do orientador (defesa A) não encontrado!');
    console.log(`  ✓ Cert orientador (defesa A): approvalId=${advisorCertA.approvalId}`);

    await certificateService.generateUserCertificate(
      student.id,
      student.email,
      Role.STUDENT,
      approvalStudent.id,
    );

    const studentCert = await prisma.userCertificate.findFirst({
      where: { approvalId: approvalStudent.id },
    });
    if (!studentCert) throw new Error('Certificado do aluno não encontrado!');
    console.log(`  ✓ Cert aluno: approvalId=${studentCert.approvalId}\n`);

    // =====================================================
    // 6. Gerar segundo certificado para o mesmo orientador (defesa B)
    // =====================================================
    console.log('📜 Passo 6: Gerando segundo certificado do orientador (defesa B)...');
    await certificateService.generateUserCertificate(
      advisor.id,
      advisor.email,
      Role.ADVISOR,
      approvalAdvisorB.id,
    );

    const advisorCertB = await prisma.userCertificate.findFirst({
      where: { approvalId: approvalAdvisorB.id },
    });
    if (!advisorCertB) throw new Error('Certificado do orientador (defesa B) não encontrado!');
    console.log(`  ✓ Cert orientador (defesa B): approvalId=${advisorCertB.approvalId}`);

    const advisorCerts = await prisma.userCertificate.findMany({
      where: { userId: advisor.id, status: 'ACTIVE' },
    });
    console.log(`  ✓ Orientador tem ${advisorCerts.length} certificados ativos simultâneos\n`);

    if (advisorCerts.length !== 2) {
      throw new Error(`Esperado 2 certificados ativos, encontrado ${advisorCerts.length}`);
    }

    // =====================================================
    // 7. Assinar com certificado por approvalId
    // =====================================================
    console.log('🔐 Passo 7: Testando assinatura por approvalId...');
    const testHash = 'test-minutes-hash-a:test-eval-hash-a';

    const signatureA = await signatureService.sign(testHash, advisor.id, approvalAdvisorA.id);
    console.log(`  ✓ Assinatura defesa A: ${signatureA.substring(0, 40)}...`);

    const signatureB = await signatureService.sign(testHash, advisor.id, approvalAdvisorB.id);
    console.log(`  ✓ Assinatura defesa B: ${signatureB.substring(0, 40)}...`);

    if (signatureA === signatureB) {
      throw new Error('Assinaturas devem ser diferentes (chaves diferentes)!');
    }
    console.log('  ✓ Assinaturas são diferentes (chaves privadas distintas)\n');

    // =====================================================
    // 8. Assinar com certificado do coordenador (por userId, sem approvalId)
    // =====================================================
    console.log('🔐 Passo 8: Testando assinatura do coordenador (por userId)...');
    const coordSignature = await signatureService.sign(testHash, coordinator.id);
    console.log(`  ✓ Assinatura coordenador: ${coordSignature.substring(0, 40)}...\n`);

    // =====================================================
    // 9. Revogar certificado da defesa A (simula registro no blockchain)
    // =====================================================
    console.log('🔒 Passo 9: Revogando certificado da defesa A...');
    await certificateService.revokeCertificateByApprovalId(
      approvalAdvisorA.id,
      RevocationReason.CESSATION_OF_OPERATION,
      coordinator.id,
    );

    const revokedCert = await prisma.userCertificate.findFirst({
      where: { approvalId: approvalAdvisorA.id },
    });
    console.log(`  ✓ Cert defesa A status: ${revokedCert?.status}`);

    if (revokedCert?.status !== 'REVOKED') {
      throw new Error('Certificado da defesa A deveria estar REVOKED!');
    }

    // =====================================================
    // 10. Verificar que defesa B ainda funciona
    // =====================================================
    console.log('\n🔍 Passo 10: Verificando que defesa B ainda funciona...');
    const certBStillActive = await certificateService.getUserCertificateByApprovalId(approvalAdvisorB.id);
    if (!certBStillActive) {
      throw new Error('Certificado da defesa B deveria continuar ativo!');
    }
    console.log(`  ✓ Cert defesa B ainda ativo (mspId: ${certBStillActive.mspId})`);

    const signatureBAfterRevoke = await signatureService.sign(testHash, advisor.id, approvalAdvisorB.id);
    console.log(`  ✓ Orientador ainda assina na defesa B: ${signatureBAfterRevoke.substring(0, 40)}...`);

    // =====================================================
    // 11. Verificar que coordenador mantém certificado
    // =====================================================
    console.log('\n🔍 Passo 11: Verificando que coordenador mantém certificado...');
    const coordCertStillActive = await certificateService.getUserCertificate(coordinator.id);
    if (!coordCertStillActive) {
      throw new Error('Certificado do coordenador deveria continuar ativo!');
    }
    console.log(`  ✓ Cert coordenador ativo (mspId: ${coordCertStillActive.mspId})\n`);

    // =====================================================
    // 12. Cleanup
    // =====================================================
    console.log('🧹 Passo 12: Limpando dados de teste...');
    await prisma.certificateRevocation.deleteMany({
      where: { certificate: { userId: { in: [coordinatorId, advisorId, studentId] } } },
    });
    await prisma.userCertificate.deleteMany({
      where: { userId: { in: [coordinatorId, advisorId, studentId] } },
    });
    await prisma.approval.deleteMany({
      where: { documentId: { in: [documentA.id, documentB.id] } },
    });
    await prisma.document.deleteMany({
      where: { id: { in: [documentA.id, documentB.id] } },
    });
    await prisma.defenseStudent.deleteMany({
      where: { defenseId: { in: [defenseA.id, defenseB.id] } },
    });
    await prisma.defense.deleteMany({
      where: { id: { in: [defenseA.id, defenseB.id] } },
    });
    await prisma.student.deleteMany({ where: { id: studentId } });
    await prisma.advisor.deleteMany({ where: { id: advisorId } });
    await prisma.user.deleteMany({
      where: { id: { in: [coordinatorId, advisorId, studentId] } },
    });
    await prisma.course.deleteMany({ where: { id: course.id } });
    console.log('  ✓ Dados removidos\n');

    // =====================================================
    // Resumo
    // =====================================================
    console.log('🎉 Todos os testes passaram!\n');
    console.log('✨ Resumo:');
    console.log('   ✓ Coordenador: certificado por usuário (permanente)');
    console.log('   ✓ Orientador: certificado por approval (1 por defesa)');
    console.log('   ✓ Aluno: certificado por approval');
    console.log('   ✓ Múltiplos certificados ativos simultâneos para mesmo orientador');
    console.log('   ✓ Assinatura por approvalId funciona');
    console.log('   ✓ Assinaturas de defesas diferentes são distintas');
    console.log('   ✓ Revogação por approvalId não afeta outras defesas');
    console.log('   ✓ Coordenador mantém certificado após revogação');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error(error.stack);

    console.log('\n🧹 Tentando limpar dados de teste...');
    try {
      await prisma.certificateRevocation.deleteMany({
        where: { certificate: { userId: { in: [coordinatorId, advisorId, studentId] } } },
      });
      await prisma.userCertificate.deleteMany({
        where: { userId: { in: [coordinatorId, advisorId, studentId] } },
      });
      await prisma.approval.deleteMany({
        where: { document: { defense: { id: { startsWith: 'test-' } } } },
      });
      await prisma.document.deleteMany({
        where: { defense: { title: { startsWith: 'Defesa Teste' } } },
      });
      await prisma.defenseStudent.deleteMany({
        where: { defense: { title: { startsWith: 'Defesa Teste' } } },
      });
      await prisma.defense.deleteMany({
        where: { title: { startsWith: 'Defesa Teste' } },
      });
      await prisma.student.deleteMany({ where: { id: studentId } });
      await prisma.advisor.deleteMany({ where: { id: advisorId } });
      await prisma.user.deleteMany({
        where: { id: { in: [coordinatorId, advisorId, studentId] } },
      });
      await prisma.course.deleteMany({
        where: { code: { startsWith: 'CT-' } },
      });
    } catch (cleanupError) {
      console.error('Erro ao limpar:', cleanupError.message);
    }

    process.exit(1);
  } finally {
    await app.close();
  }
}

testCertificateFlow();
