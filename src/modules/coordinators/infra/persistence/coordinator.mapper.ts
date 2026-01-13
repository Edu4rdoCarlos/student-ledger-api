import { Coordinator as PrismaCoordinator, User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { Coordinator } from '../../domain/entities';
import { Course } from '../../../courses/domain/entities';

type PrismaCoordinatorWithRelations = PrismaCoordinator & {
  user: PrismaUser;
  course?: PrismaCourse | null;
};

export class CoordinatorMapper {
  static toDomain(prisma: PrismaCoordinatorWithRelations): Coordinator {
    const courseId = prisma.course?.id || '';

    return Coordinator.create({
      id: prisma.id,
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      courseId: courseId,
      isActive: prisma.isActive,
      course: prisma.course ? Course.create({
        code: prisma.course.code,
        name: prisma.course.name,
        active: prisma.course.active,
        coordinatorId: undefined,
        createdAt: prisma.course.createdAt,
        updatedAt: prisma.course.updatedAt,
      }, prisma.course.id) : undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(coordinator: Coordinator) {
    return {
      id: coordinator.id,
      isActive: coordinator.isActive,
    };
  }
}
