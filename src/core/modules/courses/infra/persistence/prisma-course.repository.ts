import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma';
import { Course } from '../../domain/entities';
import { ICourseRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { CourseMapper } from './course.mapper';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  private readonly defaultInclude = {
    coordinator: {
      where: {
        isActive: true,
      },
      include: {
        user: true,
        course: {
          select: {
            code: true,
            name: true,
            active: true,
          },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(course: Course): Promise<Course> {
    const data = CourseMapper.toPrisma(course);
    const created = await this.prisma.course.create({ data });
    return CourseMapper.toDomain(created);
  }

  async findById(id: string): Promise<Course | null> {
    const found = await this.prisma.course.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findByCode(code: string): Promise<Course | null> {
    const found = await this.prisma.course.findUnique({
      where: { code },
      include: this.defaultInclude,
    });
    return found ? CourseMapper.toDomain(found) : null;
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'asc' },
        include: this.defaultInclude,
      }),
      this.prisma.course.count(),
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

  async findByCoordinatorId(coordinatorId: string): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        coordinator: {
          id: coordinatorId,
        },
      },
      include: this.defaultInclude,
    });
    return courses.map(CourseMapper.toDomain);
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.course.count({ where: { code } });
    return count > 0;
  }
}
