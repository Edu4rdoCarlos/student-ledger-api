import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { Course } from '../../domain/entities';
import { ICourseRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { CourseMapper } from './course.mapper';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(course: Course): Promise<Course> {
    const data = CourseMapper.toPrisma(course);
    const created = await this.prisma.course.create({ data });
    return CourseMapper.toDomain(created);
  }

  async findById(id: string): Promise<Course | null> {
    const found = await this.prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        coordinator: {
          where: {
            isActive: true,
          },
          include: {
            user: true,
          },
        },
      },
    });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findByCode(code: string): Promise<Course | null> {
    const found = await this.prisma.course.findUnique({
      where: { code },
      include: {
        department: true,
        coordinator: {
          where: {
            isActive: true,
          },
          include: {
            user: true,
          },
        },
      },
    });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where = options?.departmentId ? { departmentId: options.departmentId } : {};

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'asc' },
        include: {
          department: true,
          coordinator: {
            where: {
              isActive: true,
            },
            include: {
              user: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: items.map(CourseMapper.toDomain),
      total,
    };
  }

  async update(course: Course): Promise<Course> {
    const data = CourseMapper.toPrisma(course);
    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data,
    });
    return CourseMapper.toDomain(updated);
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.course.count({ where: { code } });
    return count > 0;
  }
}
