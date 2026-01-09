import { Advisor as PrismaAdvisor, User as PrismaUser, Department as PrismaDepartment, Course as PrismaCourse } from '@prisma/client';
import { Advisor } from '../../domain/entities';

type PrismaAdvisorWithRelations = PrismaAdvisor & {
  user: PrismaUser;
  department?: PrismaDepartment | null;
  course?: PrismaCourse | null;
};

export class AdvisorMapper {
  static toDomain(prisma: PrismaAdvisorWithRelations): Advisor {
    return Advisor.create({
      id: prisma.id,
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      departmentId: prisma.departmentId || undefined,
      department: prisma.department
        ? {
            id: prisma.department.id,
            name: prisma.department.name,
          }
        : undefined,
      specialization: prisma.specialization || undefined,
      courseId: prisma.courseId || undefined,
      course: prisma.course
        ? {
            id: prisma.course.id,
            code: prisma.course.code,
            name: prisma.course.name,
          }
        : undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(advisor: Advisor) {
    return {
      id: advisor.id,
      departmentId: advisor.departmentId || null,
      specialization: advisor.specialization || null,
      courseId: advisor.courseId || null,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
    };
  }
}
