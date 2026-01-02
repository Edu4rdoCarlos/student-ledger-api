import { Student as PrismaStudent } from '@prisma/client';
import { Student } from '../../domain/entities';

export class StudentMapper {
  static toDomain(prisma: PrismaStudent): Student {
    return Student.create(
      {
        matricula: prisma.matricula,
        nome: prisma.nome,
        email: prisma.email,
        courseId: prisma.courseId,
        organizationId: prisma.organizationId,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(student: Student) {
    return {
      id: student.id,
      matricula: student.matricula,
      nome: student.nome,
      email: student.email,
      courseId: student.courseId,
      organizationId: student.organizationId,
    };
  }
}
