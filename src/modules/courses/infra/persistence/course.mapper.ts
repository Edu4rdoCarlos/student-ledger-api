import { Course as PrismaCourse } from '@prisma/client';
import { Course } from '../../domain/entities';

export class CourseMapper {
  static toDomain(prisma: PrismaCourse): Course {
    return Course.create(
      {
        code: prisma.code,
        name: prisma.name,
        departmentId: prisma.departmentId || undefined,
        active: prisma.active,
        coordinatorId: prisma.coordinatorId || undefined,
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
