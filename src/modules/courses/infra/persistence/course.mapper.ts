import { Course as PrismaCourse } from '@prisma/client';
import { Course } from '../../domain/entities';

export class CourseMapper {
  static toDomain(prisma: PrismaCourse): Course {
    return Course.create(
      {
        codigo: prisma.codigo,
        nome: prisma.nome,
        departmentId: prisma.departmentId || undefined,
        ativo: prisma.ativo,
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
      codigo: course.codigo,
      nome: course.nome,
      departmentId: course.departmentId || null,
      ativo: course.ativo,
      coordinatorId: course.coordinatorId || null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
