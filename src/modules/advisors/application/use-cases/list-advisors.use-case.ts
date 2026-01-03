import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorResponseDto } from '../../presentation/dtos';

export interface ListAdvisorsQuery {
  courseId?: string;
}

@Injectable()
export class ListAdvisorsUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
  ) {}

  async execute(query: ListAdvisorsQuery = {}): Promise<AdvisorResponseDto[]> {
    const advisors = query.courseId
      ? await this.advisorRepository.findByCourseId(query.courseId)
      : await this.advisorRepository.findAll();

    return advisors.map(AdvisorResponseDto.fromEntity);
  }
}
