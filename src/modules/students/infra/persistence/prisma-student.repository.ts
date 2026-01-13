import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { Student } from '../../domain/entities';
import { IStudentRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { StudentMapper } from './student.mapper';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(student: Student): Promise<Student> {
    const data = StudentMapper.toPrisma(student);
    const created = await this.prisma.student.create({
      data,
      include: { user: true }
    });
    return StudentMapper.toDomain(created);
  }

  async findById(id: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true }
    });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByMatricula(matricula: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({
      where: { registration: matricula },
      include: { user: true }
    });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({
      where: { id: userId },
      include: { user: true }
    });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        defenses: {
          include: {
            defense: true,
          },
          orderBy: {
            defense: {
              createdAt: 'desc',
            },
          },
        },
      }
    });
    return students.map(StudentMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    let where = {};

    if (options?.courseIds && options.courseIds.length > 0) {
      where = { courseId: { in: options.courseIds } };
    } else if (options?.courseId) {
      where = { courseId: options.courseId };
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'asc' },
        include: { user: true }
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items: items.map(StudentMapper.toDomain),
      total,
    };
  }

  async update(student: Student): Promise<Student> {
    const data = StudentMapper.toPrisma(student);
    const updated = await this.prisma.student.update({
      where: { id: student.id },
      data,
      include: { user: true }
    });
    return StudentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.student.delete({ where: { id } });
  }

  async existsByMatricula(matricula: string): Promise<boolean> {
    const count = await this.prisma.student.count({ where: { registration: matricula } });
    return count > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.student.count({ where: { id: userId } });
    return count > 0;
  }
}
