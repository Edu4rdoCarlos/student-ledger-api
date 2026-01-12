import { Advisor as PrismaAdvisor, User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { Advisor } from '../../domain/entities';
import { CourseMapper } from '../../../courses/infra/persistence/course.mapper';

type PrismaAdvisorWithRelations = PrismaAdvisor & {
  user: PrismaUser;
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
      specialization: advisor.specialization || null,
      courseId: advisor.courseId || null,
      isActive: advisor.isActive,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
    };
  }
}
