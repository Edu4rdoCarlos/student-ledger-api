import { Advisor as PrismaAdvisor, User as PrismaUser, Course as PrismaCourse, Defense as PrismaDefense, DefenseStudent, Student, ExamBoardMember } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { CourseMapper } from '../../../courses/infra/persistence/course.mapper';
import { Defense } from '../../../defenses/domain/entities';

type PrismaAdvisorWithRelations = PrismaAdvisor & {
  user: PrismaUser;
  course?: PrismaCourse | null;
  defenses?: (PrismaDefense & {
    students: (DefenseStudent & { student: Student & { user: PrismaUser } })[];
    examBoard?: ExamBoardMember[];
  })[];
};

export class AdvisorMapper {
  static toDomain(prisma: PrismaAdvisorWithRelations): Advisor {
    if (!prisma.specialization) {
      throw new Error('Specialization is required for advisor');
    }

    return Advisor.create({
      id: prisma.id,
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      specialization: prisma.specialization,
      courseId: prisma.courseId || undefined,
      course: prisma.course ? CourseMapper.toDomain(prisma.course) : undefined,
      isActive: prisma.isActive,
      activeAdvisorshipsCount: prisma.defenses?.length ?? 0,
      defenses: prisma.defenses?.map(defense => Defense.create({
        title: defense.title,
        defenseDate: defense.defenseDate,
        location: defense.location ?? undefined,
        finalGrade: defense.finalGrade ?? undefined,
        result: defense.result as 'PENDING' | 'APPROVED' | 'FAILED',
        status: defense.status as 'SCHEDULED' | 'CANCELED' | 'COMPLETED',
        advisorId: defense.advisorId,
        studentIds: defense.students.map(s => s.studentId),
        students: defense.students.map(s => ({
          id: s.student.id,
          name: s.student.user.name,
          email: s.student.user.email,
          registration: s.student.registration,
        })),
        examBoard: defense.examBoard?.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
        })),
        createdAt: defense.createdAt,
        updatedAt: defense.updatedAt,
      }, defense.id)),
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(advisor: Advisor) {
    return {
      id: advisor.id,
      specialization: advisor.specialization,
      courseId: advisor.courseId || null,
      isActive: advisor.isActive,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
    };
  }
}
