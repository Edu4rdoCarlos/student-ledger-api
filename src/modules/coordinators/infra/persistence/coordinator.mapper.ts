import { Coordinator as PrismaCoordinator, User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { Coordinator } from '../../domain/entities';
import { Course } from '../../../courses/domain/entities';

type PrismaCoordinatorWithRelations = PrismaCoordinator & {
  user: PrismaUser;
  courses?: PrismaCourse[];
};

export class CoordinatorMapper {
  static toDomain(prisma: PrismaCoordinatorWithRelations): Coordinator {
    const firstCourse = prisma.courses && prisma.courses.length > 0 ? prisma.courses[0] : null;
    const courseId = firstCourse?.id || '';

    return Coordinator.create({
      id: prisma.userId, // O ID real é o userId (que vem do User)
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      courseId: courseId,
      isActive: prisma.isActive,
      course: firstCourse ? Course.create({
        code: firstCourse.code,
        name: firstCourse.name,
        departmentId: firstCourse.departmentId || undefined,
        active: firstCourse.active,
        coordinatorId: firstCourse.coordinatorId || undefined,
        createdAt: firstCourse.createdAt,
        updatedAt: firstCourse.updatedAt,
      }, firstCourse.id) : undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(coordinator: Coordinator) {
    return {
      userId: coordinator.id,
      isActive: coordinator.isActive,
    };
  }
}
