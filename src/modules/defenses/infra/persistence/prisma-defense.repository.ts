import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { DefenseMapper } from './defense.mapper';

@Injectable()
export class PrismaDefenseRepository implements IDefenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    students: {
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    },
    advisor: {
      include: {
        user: true,
      },
    },
    documents: true,
  };

  async create(defense: Defense): Promise<Defense> {
    const data = DefenseMapper.toPrisma(defense);

    const created = await this.prisma.defense.create({
      data: {
        ...data,
        students: {
          create: defense.studentIds.map((studentId) => ({
            studentId,
          })),
        },
      },
      include: this.includeRelations,
    });

    return DefenseMapper.toDomain(created);
  }

  async findById(id: string): Promise<Defense | null> {
    const found = await this.prisma.defense.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    return found ? DefenseMapper.toDomain(found) : null;
  }

  async findByAdvisorId(advisorId: string): Promise<Defense[]> {
    const defenses = await this.prisma.defense.findMany({
      where: { advisorId },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
    return defenses.map(DefenseMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where: any = {};
    if (options?.advisorId) where.advisorId = options.advisorId;
    if (options?.result) where.result = options.result;

    const [items, total] = await Promise.all([
      this.prisma.defense.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: this.includeRelations,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.defense.count({ where }),
    ]);

    return {
      items: items.map(DefenseMapper.toDomain),
      total,
    };
  }

  async update(defense: Defense): Promise<Defense> {
    const data = DefenseMapper.toPrisma(defense);

    const updated = await this.prisma.defense.update({
      where: { id: defense.id },
      data,
      include: this.includeRelations,
    });

    return DefenseMapper.toDomain(updated);
  }

  async hasActiveDefense(studentId: string): Promise<boolean> {
    const count = await this.prisma.defenseStudent.count({
      where: {
        studentId,
        defense: {
          result: {
            in: ['PENDING', 'APPROVED'],
          },
        },
      },
    });

    return count > 0;
  }
}
