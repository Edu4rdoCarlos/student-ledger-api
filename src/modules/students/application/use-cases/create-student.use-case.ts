import { Inject, Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Student } from '../../domain/entities';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import {
  StudentMatriculaAlreadyExistsError,
  CourseNotFoundError,
} from '../../domain/errors';
import { CreateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateStudentDto): Promise<StudentResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new CourseNotFoundError(dto.courseId);
    }

    const matriculaExists = await this.studentRepository.existsByMatricula(dto.matricula);
    if (matriculaExists) {
      throw new StudentMatriculaAlreadyExistsError(dto.matricula);
    }

    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException(`Email já cadastrado: ${dto.email}`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: Role.STUDENT,
          organizationId: dto.organizationId,
        },
      });

      const student = Student.create({
        matricula: dto.matricula,
        userId: user.id,
        courseId: dto.courseId,
      });

      const createdStudent = await tx.student.create({
        data: {
          id: student.id,
          matricula: student.matricula,
          userId: student.userId,
          courseId: student.courseId,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        },
      });

      return createdStudent;
    });

    const created = Student.create(
      {
        matricula: result.matricula,
        userId: result.userId,
        courseId: result.courseId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      result.id,
    );

    return StudentResponseDto.fromEntity(created);
  }
}
