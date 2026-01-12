import { Defense as PrismaDefense, DefenseStudent, Advisor, User, Student, Document, ExamBoardMember } from '@prisma/client';
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
  examBoard: ExamBoardMember[];
};

export class DefenseMapper {
  static toDomain(prisma: DefenseWithRelations): Defense {
    return Defense.create(
      {
        title: prisma.title,
        defenseDate: prisma.defenseDate,
        location: prisma.location ?? undefined,
        finalGrade: prisma.finalGrade ?? undefined,
        result: prisma.result as 'PENDING' | 'APPROVED' | 'FAILED',
        status: prisma.status as 'SCHEDULED' | 'CANCELED' | 'COMPLETED',
        advisorId: prisma.advisorId,
        studentIds: prisma.students.map((s) => s.studentId),
        examBoard: prisma.examBoard.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
        })),
        advisor: {
          id: prisma.advisor.id,
          name: prisma.advisor.user.name,
          email: prisma.advisor.user.email,
          specialization: prisma.advisor.specialization ?? undefined,
          isActive: prisma.advisor.isActive,
        },
        students: prisma.students.map((s) => ({
          id: s.student.id,
          name: s.student.user.name,
          email: s.student.user.email,
          registration: s.student.registration,
        })),
        documents: prisma.documents.map((d) => ({
          id: d.id,
          version: d.version,
          documentHash: d.documentHash ?? '',
          documentCid: d.documentCid ?? undefined,
          status: d.status,
          changeReason: d.changeReason ?? undefined,
          blockchainTxId: d.blockchainTxId ?? undefined,
          blockchainRegisteredAt: d.blockchainRegisteredAt ?? undefined,
          defenseId: d.defenseId,
          previousVersionId: d.previousVersionId ?? undefined,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          downloadUrl: `/api/documents/${d.id}/download`,
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
      location: defense.location ?? null,
      finalGrade: defense.finalGrade ?? null,
      result: defense.result,
      status: defense.status,
      advisorId: defense.advisorId,
      createdAt: defense.createdAt,
      updatedAt: defense.updatedAt,
    };
  }
}
