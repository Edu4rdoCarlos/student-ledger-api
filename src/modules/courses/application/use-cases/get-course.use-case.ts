import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseNotFoundError } from '../../domain/errors';
import { CourseResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(code: string): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findByCode(code);
    if (!course) {
      throw new CourseNotFoundError(code);
    }
    return CourseResponseDto.fromEntity(course);
  }
}
