import { Defense as PrismaDefense, DefenseStudent, Advisor, User, Student, Document, ExamBoardMember, Approval, Course } from '@prisma/client';
import { Defense } from '../../domain/entities';

type DefenseWithRelations = PrismaDefense & {
  students: (DefenseStudent & {
    student: Student & {
      user: User;
      course: Course | null;
    };
  })[];
  advisor: Advisor & {
    user: User;
  };
  documents: (Document & {
    approvals: (Approval & {
      approver: {
        name: string;
        email: string;
        role: string;
      } | null;
    })[];
  })[];
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
          course: s.student.course ? {
            id: s.student.course.id,
            code: s.student.course.code,
            name: s.student.course.name,
          } : undefined,
        })),
        documents: prisma.documents.map((d) => ({
          id: d.id,
          version: d.version,
          documentHash: d.documentHash ?? '',
          documentCid: d.documentCid ?? undefined,
          status: d.status,
          changeReason: d.changeReason ?? undefined,
          blockchainRegisteredAt: d.blockchainRegisteredAt ?? undefined,
          defenseId: d.defenseId,
          previousVersionId: d.previousVersionId ?? undefined,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          approvals: d.approvals?.map((a) => ({
            role: a.role,
            status: a.status,
            approvedAt: a.approvedAt ?? undefined,
            justification: a.justification ?? undefined,
            approverId: a.approverId ?? undefined,
            approver: a.approver ? {
              name: a.approver.name,
              email: a.approver.email,
              role: a.approver.role,
            } : undefined,
          })),
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
