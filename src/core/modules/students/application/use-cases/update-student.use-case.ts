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
    const student = await this.findAndValidateStudent(matricula);
    await this.updateStudentData(student, dto);
    const updated = await this.findAndValidateStudent(matricula);
    const course = await this.findAndValidateCourse(updated.courseId);

    return this.buildResponse(updated, course);
  }

  private async findAndValidateStudent(matricula: string) {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new StudentNotFoundError(matricula);
    }
    return student;
  }

  private async updateStudentData(student: any, dto: UpdateStudentDto): Promise<void> {
    if (dto.name !== undefined) {
      await this.userRepository.updateName(student.userId, dto.name);
    }

    if (dto.courseId !== undefined) {
      student.updateCourse(dto.courseId);
      await this.studentRepository.update(student);
    }
  }

  private async findAndValidateCourse(courseId: string) {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }
    return course;
  }

  private buildResponse(student: any, course: any): StudentResponseDto {
    return {
      userId: student.id,
      registration: student.matricula,
      name: student.name,
      email: student.email,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      createdAt: student.createdAt!,
      updatedAt: student.updatedAt!,
    };
  }
}
