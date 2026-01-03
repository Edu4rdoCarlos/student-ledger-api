import { Defense as PrismaDefense, DefenseStudent } from '@prisma/client';
import { Defense } from '../../domain/entities';

type DefenseWithStudents = PrismaDefense & {
  students: DefenseStudent[];
};

export class DefenseMapper {
  static toDomain(prisma: DefenseWithStudents): Defense {
    return Defense.create(
      {
        title: prisma.title,
        defenseDate: prisma.defenseDate,
        finalGrade: prisma.finalGrade ?? undefined,
        result: prisma.result as 'PENDING' | 'APPROVED' | 'FAILED',
        advisorId: prisma.advisorId,
        studentIds: prisma.students.map((s) => s.studentId),
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(defense: Defense) {
    return {
      id: defense.id,
      title: defense.title,
      defenseDate: defense.defenseDate,
      finalGrade: defense.finalGrade ?? null,
      result: defense.result,
      advisorId: defense.advisorId,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
