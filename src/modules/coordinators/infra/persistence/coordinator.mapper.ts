import { Coordinator as PrismaCoordinator } from '@prisma/client';
import { Coordinator } from '../../domain/entities';

export class CoordinatorMapper {
  static toDomain(prisma: PrismaCoordinator & { courses?: any[] }): Coordinator {
    const courseId = prisma.courses && prisma.courses.length > 0
      ? prisma.courses[0].id
      : '';

    return Coordinator.create(
      {
        userId: prisma.userId,
        courseId: courseId,
        isActive: prisma.isActive,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(coordinator: Coordinator) {
    return {
      id: coordinator.id,
      userId: coordinator.userId,
      isActive: coordinator.isActive,
    };
  }
}
