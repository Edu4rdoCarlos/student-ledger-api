import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { UpdateStudentDto, StudentResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(matricula: string, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new StudentNotFoundError(matricula);
    }

    if (dto.name !== undefined) {
      await this.userRepository.updateName(student.userId, dto.name);
    }

    if (dto.courseId !== undefined) {
      student.updateCourse(dto.courseId);
      await this.studentRepository.update(student);
    }

    const updated = await this.studentRepository.findByMatricula(matricula);
    if (!updated) {
      throw new StudentNotFoundError(matricula);
    }

    const course = await this.courseRepository.findById(updated.courseId);

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    return {
      userId: updated.id,
      registration: updated.matricula,
      name: updated.name,
      email: updated.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      createdAt: updated.createdAt!,
      updatedAt: updated.updatedAt!,
    };
  }
}
