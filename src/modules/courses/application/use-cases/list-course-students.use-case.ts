import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { ICurrentUser } from '../../../../shared/types';
import { StudentResponseDto } from '../../../students/presentation/dtos/response';

export interface ListCourseStudentsRequest {
  courseId: string;
  currentUser: ICurrentUser;
}

@Injectable()
export class ListCourseStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(request: ListCourseStudentsRequest): Promise<StudentResponseDto[]> {
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (request.currentUser.role === 'COORDINATOR') {
      if (!request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }

      if (request.currentUser.courseId !== request.courseId) {
        throw new ForbiddenException('Coordenador só pode listar alunos do seu próprio curso');
      }
    }

    const students = await this.studentRepository.findByCourseId(request.courseId);

    return students.map(student => ({
      userId: student.userId,
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
    }));
  }
}
