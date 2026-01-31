import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma';
import { Coordinator } from '../../domain/entities';
import {
  ICoordinatorRepository,
  FindAllCoordinatorsOptions,
  FindAllCoordinatorsResult,
} from '../../application/ports';
import { CoordinatorMapper } from './coordinator.mapper';

const COORDINATOR_INCLUDE = {
  user: true,
  course: true,
} as const;

@Injectable()
export class PrismaCoordinatorRepository implements ICoordinatorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(coordinator: Coordinator): Promise<Coordinator> {
    const created = await this.prisma.coordinator.create({
      data: {
        id: coordinator.id,
        isActive: coordinator.isActive,
        courseId: coordinator.courseId || null,
      },
      include: COORDINATOR_INCLUDE,
    });

    return CoordinatorMapper.toDomain(created);
  }

  async findById(id: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findUnique({
      where: { id },
      include: COORDINATOR_INCLUDE,
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findUnique({
      where: { id: userId },
      include: COORDINATOR_INCLUDE,
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Coordinator | null> {
    const found = await this.prisma.coordinator.findFirst({
      where: { courseId },
      include: COORDINATOR_INCLUDE,
    });
    return found ? CoordinatorMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Coordinator[]> {
    const coordinators = await this.prisma.coordinator.findMany({
      include: COORDINATOR_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return coordinators.map(CoordinatorMapper.toDomain);
  }

  async update(coordinator: Coordinator): Promise<Coordinator> {
    const data = CoordinatorMapper.toPrisma(coordinator);
    const updated = await this.prisma.coordinator.update({
      where: { id: coordinator.id },
      data: {
        isActive: data.isActive,
        courseId: data.courseId,
      },
      include: COORDINATOR_INCLUDE,
    });
    return CoordinatorMapper.toDomain(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.coordinator.count({ where: { id: userId } });
    return count > 0;
  }

  async findAllPaginated(options: FindAllCoordinatorsOptions = {}): Promise<FindAllCoordinatorsResult> {
    const { skip = 0, take = 10 } = options;

    const [coordinators, total] = await Promise.all([
      this.prisma.coordinator.findMany({
        skip,
        take,
        include: COORDINATOR_INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.coordinator.count(),
    ]);

    return {
      items: coordinators.map(CoordinatorMapper.toDomain),
      total,
    };
  }
}
