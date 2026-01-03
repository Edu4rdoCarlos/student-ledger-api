import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { DefenseMapper } from './defense.mapper';

@Injectable()
export class PrismaDefenseRepository implements IDefenseRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        students: true,
      },
    });

    return DefenseMapper.toDomain(created);
  }

  async findById(id: string): Promise<Defense | null> {
    const found = await this.prisma.defense.findUnique({
      where: { id },
      include: { students: true },
    });
    return found ? DefenseMapper.toDomain(found) : null;
  }

  async findByAdvisorId(advisorId: string): Promise<Defense[]> {
    const defenses = await this.prisma.defense.findMany({
      where: { advisorId },
      include: { students: true },
      orderBy: { createdAt: 'desc' },
    });
    return defenses.map(DefenseMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where: any = {};
    if (options?.advisorId) where.advisorId = options.advisorId;
    if (options?.resultado) where.resultado = options.resultado;

    const [items, total] = await Promise.all([
      this.prisma.defense.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: { students: true },
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
      include: { students: true },
    });

    return DefenseMapper.toDomain(updated);
  }

  async hasActiveDefense(studentId: string): Promise<boolean> {
    const count = await this.prisma.defenseStudent.count({
      where: {
        studentId,
        defense: {
          resultado: {
            in: ['PENDENTE', 'APROVADO'],
          },
        },
      },
    });

    return count > 0;
  }
}
