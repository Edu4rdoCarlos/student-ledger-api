import { Injectable, Inject } from '@nestjs/common';
import { IDefenseRepository, DEFENSE_REPOSITORY, FindAllOptions, FindAllResult } from '../ports';
import { ICurrentUser } from '../../../../shared/types';

@Injectable()
export class ListDefensesUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(options?: FindAllOptions, currentUser?: ICurrentUser): Promise<FindAllResult> {
    let courseId = options?.courseId;
    if (currentUser?.role === 'COORDINATOR' && currentUser.courseId) {
      courseId = currentUser.courseId;
    }

    return this.defenseRepository.findAll({ ...options, courseId });
  }
}
