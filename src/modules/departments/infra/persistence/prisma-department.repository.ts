import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
import { Department } from '../../domain/entities';
import { IDepartmentRepository, FindAllOptions, FindAllResult } from '../../application/ports';
import { DepartmentMapper } from './department.mapper';

@Injectable()
export class PrismaDepartmentRepository implements IDepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Department | null> {
    const found = await this.prisma.department.findUnique({ where: { id } });
    return found ? DepartmentMapper.toDomain(found) : null;
  }

  async findAll(options?: FindAllOptions): Promise<FindAllResult> {
    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        skip: options?.skip,
        take: options?.take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.department.count(),
    ]);

    return {
      items: items.map(DepartmentMapper.toDomain),
      total,
    };
  }

  async update(department: Department): Promise<Department> {
    const data = DepartmentMapper.toPrisma(department);
    const updated = await this.prisma.department.update({
      where: { id: department.id },
      data,
    });
    return DepartmentMapper.toDomain(updated);
  }
}
