import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma';
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
    documents: {
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        version: Prisma.SortOrder.desc,
      },
    },
    examBoard: true,
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
        examBoard: defense.examBoard
          ? {
              create: defense.examBoard.map((member) => ({
                name: member.name,
                email: member.email,
              })),
            }
          : undefined,
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

  async findByStudentId(studentId: string): Promise<Defense[]> {
    const defenses = await this.prisma.defense.findMany({
      where: {
        students: {
          some: {
            studentId,
          },
        },
      },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
    return defenses.map(DefenseMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where: any = {};
    if (options?.courseId) {
      where.students = {
        some: {
          student: {
            courseId: options.courseId,
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.defense.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        include: this.includeRelations,
        orderBy: { createdAt: options?.order || 'desc' },
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
      data: {
        ...data,
        examBoard: defense.examBoard
          ? {
              deleteMany: {},
              create: defense.examBoard.map((member) => ({
                name: member.name,
                email: member.email,
              })),
            }
          : undefined,
      },
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

  async getDefenseCourseId(defenseId: string): Promise<string | null> {
    const defense = await this.prisma.defense.findUnique({
      where: { id: defenseId },
      select: {
        students: {
          select: {
            student: {
              select: {
                courseId: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    return defense?.students?.[0]?.student?.courseId || null;
  }
}
