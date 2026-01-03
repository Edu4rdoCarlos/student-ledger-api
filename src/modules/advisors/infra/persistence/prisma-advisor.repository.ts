import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { AdvisorMapper } from './advisor.mapper';

@Injectable()
export class PrismaAdvisorRepository implements IAdvisorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(advisor: Advisor): Promise<Advisor> {
    const data = AdvisorMapper.toPrisma(advisor);
    const created = await this.prisma.advisor.create({ data });
    return AdvisorMapper.toDomain(created);
  }

  async findById(id: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({ where: { id } });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({ where: { userId } });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Advisor[]> {
    const advisors = await this.prisma.advisor.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
    return advisors.map(AdvisorMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where = options?.courseId ? { courseId: options.courseId } : {};

    const [items, total] = await Promise.all([
      this.prisma.advisor.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.advisor.count({ where }),
    ]);

    return {
      items: items.map(AdvisorMapper.toDomain),
      total,
    };
  }

  async update(advisor: Advisor): Promise<Advisor> {
    const data = AdvisorMapper.toPrisma(advisor);
    const updated = await this.prisma.advisor.update({
      where: { id: advisor.id },
      data,
    });
    return AdvisorMapper.toDomain(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.advisor.count({ where: { userId } });
    return count > 0;
  }
}
