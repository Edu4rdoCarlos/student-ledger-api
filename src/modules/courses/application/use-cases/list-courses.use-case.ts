import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseResponseDto } from '../../presentation/dtos';

export interface ListCoursesQuery {
  organizationId?: string;
}

@Injectable()
export class ListCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(query: ListCoursesQuery = {}): Promise<CourseResponseDto[]> {
    const courses = query.organizationId
      ? await this.courseRepository.findByOrganizationId(query.organizationId)
      : await this.courseRepository.findAll();

    return courses.map(CourseResponseDto.fromEntity);
  }
}
