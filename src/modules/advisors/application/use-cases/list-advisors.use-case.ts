import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';
import { ICurrentUser } from '../../../../shared/types';

export interface ListAdvisorsQuery {
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface ListAdvisorsResponse {
  data: AdvisorResponseDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListAdvisorsUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
  ) {}

  async execute(query: ListAdvisorsQuery = {}, currentUser?: ICurrentUser): Promise<ListAdvisorsResponse> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    let courseId = query?.courseId;
    if (currentUser?.role === 'COORDINATOR' && currentUser.courseId) {
      courseId = currentUser.courseId;
    }

    const { items, total } = await this.advisorRepository.findAll({
      skip,
      take: limit,
      courseId,
    });

    return {
      data: items.map(AdvisorResponseDto.fromEntity),
      metadata: new PaginationMetadata({ page, perPage: limit, total }),
    };
  }
}
