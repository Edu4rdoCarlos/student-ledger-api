import { Course as PrismaCourse, Coordinator as PrismaCoordinator, User as PrismaUser } from '@prisma/client';
import { Course } from '../../domain/entities';
import { UserBase } from '../../../user/domain/entities';

type CourseBasic = {
  code: string;
  name: string;
  active: boolean;
};

type CoordinatorWithUser = PrismaCoordinator & {
  user: PrismaUser;
  course?: CourseBasic | null;
};

type CourseWithRelations = PrismaCourse & {
  coordinator?: CoordinatorWithUser | null;
};

export class CourseMapper {
  static toDomain(prisma: CourseWithRelations): Course {
    return Course.create(
      {
        code: prisma.code,
        name: prisma.name,
        active: prisma.active,
        coordinatorId: prisma.coordinator?.id || undefined,
        coordinator: prisma.coordinator && prisma.coordinator.user ? new UserBase({
          id: prisma.coordinator.user.id,
          email: prisma.coordinator.user.email,
          name: prisma.coordinator.user.name,
          role: prisma.coordinator.user.role,
          isFirstAccess: prisma.coordinator.user.isFirstAccess,
          createdAt: prisma.coordinator.user.createdAt,
          updatedAt: prisma.coordinator.user.updatedAt,
          course: prisma.coordinator.course,
        }) : undefined,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(course: Course) {
    return {
      id: course.id,
      code: course.code,
      name: course.name,
      active: course.active,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
