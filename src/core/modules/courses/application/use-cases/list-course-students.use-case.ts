import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../../defenses/application/ports';
import { ICurrentUser } from '../../../../../shared/types';
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
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
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

    const studentsWithDefenseInfo = await Promise.all(
      students.map(async (student) => {
        const defenseSummary = await this.defenseRepository.findSummaryByStudentId(student.userId);
        const mostRecentDefense = defenseSummary.length > 0 ? defenseSummary[0] : null;

        return {
          userId: student.userId,
          registration: student.matricula,
          name: student.name,
          email: student.email,
          course: {
            id: course.id,
            name: course.name,
            code: course.code,
          },
          defensesCount: defenseSummary.length,
          defenseStatus: mostRecentDefense?.status,
          createdAt: student.createdAt!,
          updatedAt: student.updatedAt!,
        };
      })
    );

    return studentsWithDefenseInfo;
  }
}
