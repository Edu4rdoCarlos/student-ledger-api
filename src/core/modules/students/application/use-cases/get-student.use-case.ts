import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IStudentRepository, STUDENT_REPOSITORY } from '../ports';
import { StudentNotFoundError } from '../../domain/errors';
import { StudentResponseDto } from '../../presentation/dtos';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';

export interface GetStudentRequest {
  matricula: string;
  currentUser: {
    id: string;
    email: string;
    role: Role;
  };
}

@Injectable()
export class GetStudentUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(request: GetStudentRequest): Promise<StudentResponseDto> {
    const student = await this.findAndValidateStudent(request.matricula);
    const course = await this.findAndValidateCourse(student.courseId);
    const defenseIds = await this.getDefenseIds(student.id);

    return this.buildResponse(student, course, defenseIds);
  }

  private async findAndValidateStudent(matricula: string) {
    const student = await this.studentRepository.findByMatricula(matricula);
    if (!student) {
      throw new StudentNotFoundError(matricula);
    }
    return student;
  }

  private async findAndValidateCourse(courseId: string) {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }
    return course;
  }

  private async getDefenseIds(studentId: string): Promise<string[]> {
    const defenses = await this.defenseRepository.findByStudentId(studentId);
    return defenses.map(defense => defense.id);
  }

  private buildResponse(student: any, course: any, defenseIds: string[]): StudentResponseDto {
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
      defenseIds,
    };
  }
}
