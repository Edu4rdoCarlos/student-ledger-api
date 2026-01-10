import { Course as PrismaCourse, Department as PrismaDepartment, Coordinator as PrismaCoordinator, User as PrismaUser } from '@prisma/client';
import { Course } from '../../domain/entities';
import { DepartmentMapper } from '../../../departments/infra/persistence/department.mapper';
import { UserBase } from '../../../user/domain/entities';

type CoordinatorWithUser = PrismaCoordinator & {
  user: PrismaUser;
};

type CourseWithRelations = PrismaCourse & {
  department?: PrismaDepartment | null;
  coordinator?: CoordinatorWithUser | null;
};

export class CourseMapper {
  static toDomain(prisma: CourseWithRelations): Course {
    return Course.create(
      {
        code: prisma.code,
        name: prisma.name,
        departmentId: prisma.departmentId || undefined,
        active: prisma.active,
        coordinatorId: prisma.coordinatorId || undefined,
        department: prisma.department ? DepartmentMapper.toDomain(prisma.department) : undefined,
        coordinator: prisma.coordinator ? new UserBase({
          id: prisma.coordinator.user.id,
          email: prisma.coordinator.user.email,
          name: prisma.coordinator.user.name,
          role: prisma.coordinator.user.role,
          isFirstAccess: prisma.coordinator.user.isFirstAccess,
          createdAt: prisma.coordinator.user.createdAt,
          updatedAt: prisma.coordinator.user.updatedAt,
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
      departmentId: course.departmentId || null,
      active: course.active,
      coordinatorId: course.coordinatorId || null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
