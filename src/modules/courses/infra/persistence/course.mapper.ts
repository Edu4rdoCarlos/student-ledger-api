import { Course as PrismaCourse } from '@prisma/client';
import { Course } from '../../domain/entities';

export class CourseMapper {
  static toDomain(prisma: PrismaCourse): Course {
    return Course.create(
      {
        codigo: prisma.codigo,
        nome: prisma.nome,
        departamento: prisma.departamento || undefined,
        ativo: prisma.ativo,
        organizationId: prisma.organizationId,
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
      departamento: course.departamento || null,
      ativo: course.ativo,
      organizationId: course.organizationId,
      coordinatorId: course.coordinatorId || null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
