import { Department as PrismaDepartment } from '@prisma/client';
import { Department } from '../../domain/entities';

export class DepartmentMapper {
  static toDomain(prisma: PrismaDepartment): Department {
    return Department.create(
      {
        name: prisma.name,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(department: Department) {
    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };
  }
}
