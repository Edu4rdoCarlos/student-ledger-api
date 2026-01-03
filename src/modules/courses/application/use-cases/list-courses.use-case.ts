import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseResponseDto } from '../../presentation/dtos';
import { PaginationMetadata } from '../../../../shared/dtos';

export interface ListCoursesQuery {
  organizationId?: string;
  page?: number;
  limit?: number;
}

export interface ListCoursesResponse {
  data: CourseResponseDto[];
  metadata: PaginationMetadata;
}

@Injectable()
export class ListCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(query: ListCoursesQuery = {}): Promise<ListCoursesResponse> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const { items, total } = await this.courseRepository.findAll({
      skip,
      take: limit,
      organizationId: query?.organizationId,
    });

    return {
      data: items.map(CourseResponseDto.fromEntity),
      metadata: new PaginationMetadata({ page, perPage: limit, total }),
    };
  }
}
