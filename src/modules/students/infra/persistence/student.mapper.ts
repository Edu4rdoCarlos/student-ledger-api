import { Student as PrismaStudent, User as PrismaUser } from '@prisma/client';
import { Student } from '../../domain/entities';

type PrismaStudentWithUser = PrismaStudent & { user: PrismaUser };

export class StudentMapper {
  static toDomain(prisma: PrismaStudentWithUser): Student {
    return Student.create({
      id: prisma.id,
      matricula: prisma.registration,
      courseId: prisma.courseId,
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(student: Student) {
    return {
      id: student.id,
      registration: student.matricula,
      courseId: student.courseId,
    };
  }
}
