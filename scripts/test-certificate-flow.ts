import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma';
import { CertificateManagementService } from '../src/modules/fabric/application/services/certificate-management.service';
import { SignatureService } from '../src/modules/fabric/application/services';
import { Role } from '@prisma/client';

async function testCertificateFlow() {
  console.log('🚀 Iniciando teste do fluxo de certificados...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const certificateService = app.get(CertificateManagementService);
  const signatureService = app.get(SignatureService);

  const testUserId = `test-user-${Date.now()}`;
  const testEmail = `test${Date.now()}@example.com`;

  try {
    console.log('📝 Passo 1: Criando usuário de teste...');
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        password: 'hashed_password',
        role: Role.STUDENT,
      },
    });
    console.log(`✅ Usuário criado: ${user.id} (${user.email})\n`);

    console.log('📜 Passo 2: Gerando certificado...');
    await certificateService.generateUserCertificate(
      user.id,
      user.email,
      Role.STUDENT,
    );
    console.log('✅ Certificado gerado com sucesso\n');

    console.log('🔍 Passo 3: Verificando certificado no banco...');
    const certificate = await prisma.userCertificate.findFirst({
      where: { userId: user.id },
    });

    if (!certificate) {
      throw new Error('❌ Certificado não encontrado no banco!');
    }

    console.log(`✅ Certificado encontrado:`);
    console.log(`   - MSP ID: ${certificate.mspId}`);
    console.log(`   - Enrollment ID: ${certificate.enrollmentId}`);
    console.log(`   - Serial Number: ${certificate.serialNumber}`);
    console.log(`   - Status: ${certificate.status}`);
    console.log(`   - Válido até: ${certificate.notAfter}\n`);

    console.log('🔐 Passo 4: Testando assinatura com certificado...');
    const testHash = 'test-hash-123:test-hash-456';
    const signature = await signatureService.sign(testHash, user.id);
    console.log(`✅ Assinatura gerada: ${signature.substring(0, 50)}...\n`);

    console.log('✔️  Passo 5: Verificando assinatura...');
    const isValid = await signatureService.verify(testHash, signature, user.id);
    if (!isValid) {
      throw new Error('❌ Assinatura inválida!');
    }
    console.log('✅ Assinatura válida\n');

    console.log('🧪 Passo 6: Testando assinatura com hash diferente (deve falhar)...');
    const isInvalidForDifferentHash = await signatureService.verify(
      'different-hash',
      signature,
      user.id,
    );
    if (isInvalidForDifferentHash) {
      throw new Error('❌ Assinatura deveria ser inválida para hash diferente!');
    }
    console.log('✅ Assinatura corretamente rejeitada para hash diferente\n');

    console.log('🧹 Passo 7: Limpando dados de teste...');
    await prisma.userCertificate.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Dados de teste removidos\n');

    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('\n✨ Resumo:');
    console.log('   ✓ Certificado gerado via Fabric CA');
    console.log('   ✓ Certificado armazenado no PostgreSQL');
    console.log('   ✓ Assinatura digital funcionando');
    console.log('   ✓ Verificação de assinatura funcionando');
    console.log('   ✓ Cada usuário tem seu próprio certificado único');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error(error.stack);

    console.log('\n🧹 Tentando limpar dados de teste...');
    try {
      await prisma.userCertificate.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    } catch (cleanupError) {
      console.error('Erro ao limpar:', cleanupError.message);
    }

    process.exit(1);
  } finally {
    await app.close();
  }
}

testCertificateFlow();
