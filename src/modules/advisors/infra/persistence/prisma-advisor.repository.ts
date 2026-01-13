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
    let courseWhere = {};

    if (options?.courseIds && options.courseIds.length > 0) {
      where = { courseId: { in: options.courseIds } };
      courseWhere = { id: { in: options.courseIds } };
    } else if (options?.courseId) {
      where = { courseId: options.courseId };
      courseWhere = { id: options.courseId };
    }

    // Buscar advisors e coordenadores em paralelo
    const [advisors, coordinators, advisorCount] = await Promise.all([
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
      // Buscar coordenadores que também são advisors
      this.prisma.coordinator.findMany({
        where: Object.keys(courseWhere).length > 0 ? {
          courses: {
            some: courseWhere
          }
        } : undefined,
        include: {
          user: true,
          courses: true,
        },
      }),
      this.prisma.advisor.count({ where }),
    ]);

    // Converter coordenadores para formato de Advisor
    const coordinatorsAsAdvisors = await Promise.all(
      coordinators.map(async (coordinator) => {
        // Buscar se o coordenador já existe como advisor
        const existingAdvisor = advisors.find(a => a.id === coordinator.id);
        if (existingAdvisor) {
          return null; // Já está na lista de advisors
        }

        // Buscar as defesas do coordenador
        const defenses = await this.prisma.defense.findMany({
          where: {
            advisorId: coordinator.id,
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
        });

        return {
          id: coordinator.id,
          specialization: 'Coordenador',
          isActive: coordinator.isActive,
          createdAt: coordinator.createdAt,
          updatedAt: coordinator.updatedAt,
          courseId: coordinator.courses[0]?.id || null,
          user: coordinator.user,
          course: coordinator.courses[0] || null,
          defenses,
        };
      })
    );

    // Filtrar nulos e combinar com advisors
    const allAdvisors = [
      ...advisors,
      ...coordinatorsAsAdvisors.filter(c => c !== null),
    ];

    return {
      items: allAdvisors.map(AdvisorMapper.toDomain),
      total: advisorCount + coordinatorsAsAdvisors.filter(c => c !== null).length,
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
