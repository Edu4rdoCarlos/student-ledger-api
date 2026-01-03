import { Advisor as PrismaAdvisor } from '@prisma/client';
import { Advisor } from '../../domain/entities';

export class AdvisorMapper {
  static toDomain(prisma: PrismaAdvisor): Advisor {
    return Advisor.create(
      {
        userId: prisma.userId,
        departamento: prisma.departamento || undefined,
        specialization: prisma.specialization || undefined,
        courseId: prisma.courseId || undefined,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      prisma.id,
    );
  }

  static toPrisma(advisor: Advisor) {
    return {
      id: advisor.id,
      userId: advisor.userId,
      departamento: advisor.departamento || null,
      specialization: advisor.specialization || null,
      courseId: advisor.courseId || null,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
    };
  }
}
