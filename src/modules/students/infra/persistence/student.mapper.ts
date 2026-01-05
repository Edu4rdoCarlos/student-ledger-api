import { Student as PrismaStudent } from '@prisma/client';
import { Student } from '../../domain/entities';

export class StudentMapper {
  static toDomain(prisma: PrismaStudent): Student {
    return Student.create(
      {
        matricula: prisma.registration,
        userId: prisma.id,
        courseId: prisma.courseId,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(student: Student) {
    return {
      id: student.id,
      registration: student.matricula,
      courseId: student.courseId,
    };
  }
}
