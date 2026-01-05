import { Defense as PrismaDefense, DefenseStudent, Advisor, User, Student, Document } from '@prisma/client';
import { Defense } from '../../domain/entities';

type DefenseWithRelations = PrismaDefense & {
  students: (DefenseStudent & {
    student: Student & {
      user: User;
    };
  })[];
  advisor: Advisor & {
    user: User;
  };
  documents: Document[];
};

export class DefenseMapper {
  static toDomain(prisma: DefenseWithRelations): Defense {
    return Defense.create(
      {
        title: prisma.title,
        defenseDate: prisma.defenseDate,
        finalGrade: prisma.finalGrade ?? undefined,
        result: prisma.result as 'PENDING' | 'APPROVED' | 'FAILED',
        advisorId: prisma.advisorId,
        studentIds: prisma.students.map((s) => s.studentId),
        advisor: {
          id: prisma.advisor.id,
          name: prisma.advisor.user.name,
          email: prisma.advisor.user.email,
          specialization: prisma.advisor.specialization ?? undefined,
        },
        students: prisma.students.map((s) => ({
          id: s.student.id,
          name: s.student.user.name,
          email: s.student.user.email,
          registration: s.student.registration,
        })),
        documents: prisma.documents.map((d) => ({
          id: d.id,
          type: d.tipo,
          hash: d.documentoHash,
          path: d.arquivoPath ?? undefined,
        })),
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
