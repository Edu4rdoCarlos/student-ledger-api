import { Injectable } from '@nestjs/common';
import { DefenseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../database/prisma';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { AdvisorMapper } from './advisor.mapper';

const ACTIVE_DEFENSE_STATUSES: DefenseStatus[] = [
  DefenseStatus.SCHEDULED,
  DefenseStatus.COMPLETED,
];

const ADVISOR_BASE_INCLUDE = {
  user: true,
  course: true,
};

const DEFENSE_INCLUDE = {
  students: {
    include: {
      student: { include: { user: true } },
    },
  },
  examBoard: true,
};

const ADVISOR_WITH_DEFENSES_INCLUDE = {
  ...ADVISOR_BASE_INCLUDE,
  defenses: {
    where: { status: { in: ACTIVE_DEFENSE_STATUSES } },
    include: DEFENSE_INCLUDE,
  },
};

@Injectable()
export class PrismaAdvisorRepository implements IAdvisorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(advisor: Advisor): Promise<Advisor> {
    const data = AdvisorMapper.toPrisma(advisor);
    const created = await this.prisma.advisor.create({
      data,
      include: ADVISOR_BASE_INCLUDE,
    });
    return AdvisorMapper.toDomain(created);
  }

  async findById(id: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({
      where: { id },
      include: ADVISOR_WITH_DEFENSES_INCLUDE,
    });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({
      where: { id: userId },
      include: ADVISOR_BASE_INCLUDE,
    });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Advisor[]> {
    const advisors = await this.prisma.advisor.findMany({
      where: { courseId },
      include: ADVISOR_BASE_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return advisors.map(AdvisorMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where = this.buildCourseFilter(options);

    const [advisors, coordinators, advisorCount] = await Promise.all([
      this.prisma.advisor.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: ADVISOR_WITH_DEFENSES_INCLUDE,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.coordinator.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: ADVISOR_BASE_INCLUDE,
      }),
      this.prisma.advisor.count({ where }),
    ]);

    const coordinatorsAsAdvisors = await this.mapCoordinatorsToAdvisors(
      coordinators,
      advisors,
    );

    const allAdvisors = [...advisors, ...coordinatorsAsAdvisors];

    return {
      items: allAdvisors.map(AdvisorMapper.toDomain),
      total: advisorCount + coordinatorsAsAdvisors.length,
    };
  }

  async update(advisor: Advisor): Promise<Advisor> {
    const data = AdvisorMapper.toPrisma(advisor);
    const updated = await this.prisma.advisor.update({
      where: { id: advisor.id },
      data,
      include: ADVISOR_WITH_DEFENSES_INCLUDE,
    });
    return AdvisorMapper.toDomain(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.advisor.count({ where: { id: userId } });
    return count > 0;
  }

  private buildCourseFilter(options?: FindAllOptions) {
    if (options?.courseIds && options.courseIds.length > 0) {
      return { courseId: { in: options.courseIds } };
    }
    if (options?.courseId) {
      return { courseId: options.courseId };
    }
    return {};
  }

  private async mapCoordinatorsToAdvisors(
    coordinators: any[],
    existingAdvisors: any[],
  ): Promise<any[]> {
    const existingIds = new Set(existingAdvisors.map(a => a.id));

    const newCoordinators = coordinators.filter(c => !existingIds.has(c.id));

    return Promise.all(
      newCoordinators.map(async (coordinator) => {
        const defenses = await this.prisma.defense.findMany({
          where: {
            advisorId: coordinator.id,
            status: { in: ACTIVE_DEFENSE_STATUSES },
          },
          include: DEFENSE_INCLUDE,
        });

        return {
          id: coordinator.id,
          specialization: 'Coordenador',
          isActive: coordinator.isActive,
          createdAt: coordinator.createdAt,
          updatedAt: coordinator.updatedAt,
          courseId: coordinator.course?.id || null,
          user: coordinator.user,
          course: coordinator.course || null,
          defenses,
        };
      }),
    );
  }
}
