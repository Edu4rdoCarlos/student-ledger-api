import { Advisor as PrismaAdvisor, User as PrismaUser, Department as PrismaDepartment, Course as PrismaCourse } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { DepartmentMapper } from '../../../departments/infra/persistence/department.mapper';
import { CourseMapper } from '../../../courses/infra/persistence/course.mapper';

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
      department: prisma.department ? DepartmentMapper.toDomain(prisma.department) : undefined,
      specialization: prisma.specialization || undefined,
      courseId: prisma.courseId || undefined,
      course: prisma.course ? CourseMapper.toDomain(prisma.course) : undefined,
      isActive: prisma.isActive,
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
      isActive: advisor.isActive,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
    };
  }
}
