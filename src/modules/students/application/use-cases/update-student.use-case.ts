import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import {
  StudentNotFoundError,
  CourseNotFoundError,
} from '../../domain/errors';
import { UpdateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(matricula: string, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new StudentNotFoundError(matricula);
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new CourseNotFoundError(dto.courseId);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.name !== undefined) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: dto.name },
        });
      }

      if (dto.courseId !== undefined) {
        student.updateCourse(dto.courseId);
        const updated = await tx.student.update({
          where: { id: student.id },
          data: {
            courseId: student.courseId,
            updatedAt: student.updatedAt,
          },
        });
        return updated;
      }

      return await tx.student.findUnique({ where: { id: student.id } });
    });

    const updated = await this.studentRepository.findByMatricula(matricula);
    return StudentResponseDto.fromEntity(updated!);
  }
}
