import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
    role: 'ADMIN' | 'COORDINATOR' | 'ADVISOR' | 'STUDENT';
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
    const student = await this.studentRepository.findByMatricula(request.matricula);

    if (!student) {
      throw new StudentNotFoundError(request.matricula);
    }

    const course = await this.courseRepository.findById(student.courseId);

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const dbDefenses = await this.defenseRepository.findByStudentId(student.id);
    const defenseIds = dbDefenses.map(defense => defense.id);

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
