import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { ICurrentUser } from '../../../../shared/types';

export interface ListCourseAdvisorsRequest {
  courseId: string;
  currentUser: ICurrentUser;
}

export interface AdvisorWithDefensesDto {
  userId: string;
  name: string;
  email: string;
  specialization?: string;
  isActive: boolean;
  course: {
    id: string;
    name: string;
    code: string;
  };
  defensesCount: number;
  defenseStatus?: 'SCHEDULED' | 'CANCELED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ListCourseAdvisorsUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(request: ListCourseAdvisorsRequest): Promise<AdvisorWithDefensesDto[]> {
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (request.currentUser.role === 'COORDINATOR') {
      if (!request.currentUser.courseId) {
        throw new ForbiddenException('Coordenador não está associado a nenhum curso');
      }

      if (request.currentUser.courseId !== request.courseId) {
        throw new ForbiddenException('Coordenador só pode listar orientadores do seu próprio curso');
      }
    }

    const advisors = await this.advisorRepository.findByCourseId(request.courseId);

    return advisors.map(advisor => {
      const defenses = advisor.defenses || [];
      const mostRecentDefense = defenses.length > 0 ? defenses[0] : null;

      return {
        userId: advisor.userId,
        name: advisor.name,
        email: advisor.email,
        specialization: advisor.specialization,
        isActive: advisor.isActive,
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
        },
        defensesCount: defenses.length,
        defenseStatus: mostRecentDefense?.status,
        createdAt: advisor.createdAt!,
        updatedAt: advisor.updatedAt!,
      };
    });
  }
}
