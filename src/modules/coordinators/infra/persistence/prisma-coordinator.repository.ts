import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { Coordinator } from '../../domain/entities';
import { ICoordinatorRepository } from '../../application/ports';
import { CoordinatorMapper } from './coordinator.mapper';

@Injectable()
export class PrismaCoordinatorRepository implements ICoordinatorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(coordinator: Coordinator): Promise<Coordinator> {
    const data = CoordinatorMapper.toPrisma(coordinator);

    const created = await this.prisma.coordinator.create({
      data: {
        ...data,
        courses: {
          connect: { id: coordinator.courseId },
        },
      },
      include: {
        courses: true,
      },
    });

    return CoordinatorMapper.toDomain(created);
  }

  async findById(id: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findUnique({
      where: { id },
      include: { courses: true },
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findUnique({
      where: { userId },
      include: { courses: true },
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findFirst({
      where: {
        courses: {
          some: { id: courseId },
        },
      },
      include: { courses: true },
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Coordinator[]> {
    const coordinators = await this.prisma.coordinator.findMany({
      include: { courses: true },
      orderBy: { createdAt: 'asc' },
    });
    return coordinators.map(CoordinatorMapper.toDomain);
  }

  async update(coordinator: Coordinator): Promise<Coordinator> {
    const data = CoordinatorMapper.toPrisma(coordinator);
    const updated = await this.prisma.coordinator.update({
      where: { id: coordinator.id },
      data,
      include: { courses: true },
    });
    return CoordinatorMapper.toDomain(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.coordinator.count({ where: { userId } });
    return count > 0;
  }
}
