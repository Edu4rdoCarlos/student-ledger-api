import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { Advisor } from '../../domain/entities';
import { IAdvisorRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { AdvisorMapper } from './advisor.mapper';

@Injectable()
export class PrismaAdvisorRepository implements IAdvisorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(advisor: Advisor): Promise<Advisor> {
    const data = AdvisorMapper.toPrisma(advisor);
    const created = await this.prisma.advisor.create({
      data,
      include: {
        user: true,
        course: true,
      }
    });
    return AdvisorMapper.toDomain(created);
  }

  async findById(id: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
        defenses: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            examBoard: true,
          },
        },
      },
    });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Advisor | null> {
    const found = await this.prisma.advisor.findUnique({
      where: { id: userId },
      include: {
        user: true,
        course: true,
      },
    });
    return found ? AdvisorMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Advisor[]> {
    const advisors = await this.prisma.advisor.findMany({
      where: { courseId },
      include: {
        user: true,
        course: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return advisors.map(AdvisorMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    let where = {};

    if (options?.courseIds && options.courseIds.length > 0) {
      where = { courseId: { in: options.courseIds } };
    } else if (options?.courseId) {
      where = { courseId: options.courseId };
    }

    const [items, total] = await Promise.all([
      this.prisma.advisor.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: {
          user: true,
          course: true,
          defenses: {
            where: {
              status: {
                in: ['SCHEDULED', 'COMPLETED']
              }
            },
            include: {
              students: {
                include: {
                  student: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
              examBoard: true,
            },
          }
        },
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
      include: {
        user: true,
        course: true,
        defenses: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            examBoard: true,
          },
        },
      }
    });
    return AdvisorMapper.toDomain(updated);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.advisor.count({ where: { id: userId } });
    return count > 0;
  }
}
