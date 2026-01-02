import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma';
import { Student } from '../../domain/entities';
import { IStudentRepository } from '../../application/ports';
import { StudentMapper } from './student.mapper';

@Injectable()
export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(student: Student): Promise<Student> {
    const data = StudentMapper.toPrisma(student);
    const created = await this.prisma.student.create({ data });
    return StudentMapper.toDomain(created);
  }

  async findById(id: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({ where: { id } });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByMatricula(matricula: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({ where: { matricula } });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const found = await this.prisma.student.findUnique({ where: { email } });
    return found ? StudentMapper.toDomain(found) : null;
  }

  async findByCourseId(courseId: string): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      where: { courseId },
      orderBy: { nome: 'asc' },
    });
    return students.map(StudentMapper.toDomain);
  }

  async findAll(): Promise<Student[]> {
    const students = await this.prisma.student.findMany({
      orderBy: { nome: 'asc' },
    });
    return students.map(StudentMapper.toDomain);
  }

  async update(student: Student): Promise<Student> {
    const data = StudentMapper.toPrisma(student);
    const updated = await this.prisma.student.update({
      where: { id: student.id },
      data,
    });
    return StudentMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.student.delete({ where: { id } });
  }

  async existsByMatricula(matricula: string): Promise<boolean> {
    const count = await this.prisma.student.count({ where: { matricula } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.student.count({ where: { email } });
    return count > 0;
  }
}
