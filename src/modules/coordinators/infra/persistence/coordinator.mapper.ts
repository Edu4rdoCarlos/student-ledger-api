import { Coordinator as PrismaCoordinator, User as PrismaUser } from '@prisma/client';
import { Coordinator } from '../../domain/entities';

type PrismaCoordinatorWithUser = PrismaCoordinator & {
  user: PrismaUser;
  courses?: any[];
};

export class CoordinatorMapper {
  static toDomain(prisma: PrismaCoordinatorWithUser): Coordinator {
    const courseId = prisma.courses && prisma.courses.length > 0
      ? prisma.courses[0].id
      : '';

    return Coordinator.create({
      id: prisma.userId, // O ID real é o userId (que vem do User)
      email: prisma.user.email,
      name: prisma.user.name,
      role: prisma.user.role,
      isFirstAccess: prisma.user.isFirstAccess,
      courseId: courseId,
      isActive: prisma.isActive,
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
