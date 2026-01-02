import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Criar Organização padrão
  const organization = await prisma.organization.upsert({
    where: { id: 'org-default' },
    update: {},
    create: {
      id: 'org-default',
      nome: 'Universidade Federal',
      tipo: 'UNIVERSIDADE',
    },
  });
  console.log('Organization created:', organization.nome);

  // Criar Curso padrão
  const course = await prisma.course.upsert({
    where: { id: 'course-default' },
    update: {},
    create: {
      id: 'course-default',
      nome: 'Ciência da Computação',
      codigo: 'CC',
      organizationId: organization.id,
    },
  });
  console.log('Course created:', course.nome);

  // Hash da senha padrão
  const defaultPassword = await bcrypt.hash('123456', 10);

  // Criar Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@universidade.edu.br' },
    update: {},
    create: {
      email: 'admin@universidade.edu.br',
      password: defaultPassword,
      name: 'Administrador',
      role: Role.ADMIN,
      organizationId: organization.id,
    },
  });
  console.log('Admin created:', admin.email);

  // Criar Coordenador
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordenador@universidade.edu.br' },
    update: {},
    create: {
      email: 'coordenador@universidade.edu.br',
      password: defaultPassword,
      name: 'Coordenador de Curso',
      role: Role.COORDINATOR,
      organizationId: organization.id,
    },
  });
  console.log('Coordinator created:', coordinator.email);

  // Vincular coordenador ao curso
  await prisma.course.update({
    where: { id: course.id },
    data: { coordenadorId: coordinator.id },
  });

  // Criar Secretária
  const secretary = await prisma.user.upsert({
    where: { email: 'secretaria@universidade.edu.br' },
    update: {},
    create: {
      email: 'secretaria@universidade.edu.br',
      password: defaultPassword,
      name: 'Secretária Acadêmica',
      role: Role.SECRETARY,
      organizationId: organization.id,
    },
  });
  console.log('Secretary created:', secretary.email);

  // Criar Orientador
  const advisor = await prisma.user.upsert({
    where: { email: 'orientador@universidade.edu.br' },
    update: {},
    create: {
      email: 'orientador@universidade.edu.br',
      password: defaultPassword,
      name: 'Professor Orientador',
      role: Role.ADVISOR,
      organizationId: organization.id,
    },
  });
  console.log('Advisor created:', advisor.email);

  // Criar Advisor entity
  await prisma.advisor.upsert({
    where: { email: 'orientador@universidade.edu.br' },
    update: {},
    create: {
      nome: 'Professor Orientador',
      email: 'orientador@universidade.edu.br',
      titulacao: 'DOUTOR',
      organizationId: organization.id,
    },
  });

  console.log('\nSeed completed!');
  console.log('\nDefault credentials:');
  console.log('-------------------');
  console.log('Admin:       admin@universidade.edu.br / 123456');
  console.log('Coordenador: coordenador@universidade.edu.br / 123456');
  console.log('Secretária:  secretaria@universidade.edu.br / 123456');
  console.log('Orientador:  orientador@universidade.edu.br / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
