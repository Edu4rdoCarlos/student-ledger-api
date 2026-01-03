import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
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
    const found = await this.prisma.course.findUnique({ where: { id } });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findByCodigo(codigo: string): Promise<Course | null> {
    const found = await this.prisma.course.findUnique({ where: { codigo } });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return courses.map(CourseMapper.toDomain);
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const where = options?.organizationId ? { organizationId: options.organizationId } : {};

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'asc' },
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

  async existsByCodigo(codigo: string): Promise<boolean> {
    const count = await this.prisma.course.count({ where: { codigo } });
    return count > 0;
  }
}
