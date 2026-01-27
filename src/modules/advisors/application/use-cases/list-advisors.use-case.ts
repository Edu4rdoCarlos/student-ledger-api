import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { Advisor } from '../../domain/entities';
import { PaginationMetadata } from '../../../../shared/dtos';
import { ICurrentUser } from '../../../../shared/types';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';

export interface ListAdvisorsQuery {
  courseId?: string;
  page?: number;
  perPage?: number;
}

export interface ListAdvisorsResponse {
  data: Advisor[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListAdvisorsUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(query: ListAdvisorsQuery = {}, currentUser?: ICurrentUser): Promise<ListAdvisorsResponse> {
    const page = query?.page || 1;
    const perPage = query?.perPage || 10;
    const skip = (page - 1) * perPage;

    let courseId = query?.courseId;
    let courseIds: string[] | undefined;

    if (currentUser?.role === 'COORDINATOR' && currentUser.id) {
      const courses = await this.courseRepository.findByCoordinatorId(currentUser.id);
      courseIds = courses.map(course => course.id);
    } else if (currentUser?.role === 'COORDINATOR' && currentUser.courseId) {
      courseId = currentUser.courseId;
    }

    const { items, total } = await this.advisorRepository.findAll({
      skip,
      take: perPage,
      courseId,
      courseIds,
    });

    return {
      data: items,
      metadata: new PaginationMetadata({ page, perPage, total }),
    };
  }
}
