import { Injectable, Inject } from '@nestjs/common';
import { IDefenseRepository, DEFENSE_REPOSITORY, FindAllOptions, FindAllResult } from '../ports';
import { ICurrentUser } from '../../../../shared/types';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';

@Injectable()
export class ListDefensesUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(options?: FindAllOptions, currentUser?: ICurrentUser): Promise<FindAllResult> {
    let courseIds = options?.courseIds;

    if (currentUser?.role === 'COORDINATOR') {
      const courses = await this.courseRepository.findByCoordinatorId(currentUser.id);
      courseIds = courses.map(course => course.id);
    }

    return this.defenseRepository.findAll({
      ...options,
      courseIds,
      search: options?.search,
    });
  }
}
