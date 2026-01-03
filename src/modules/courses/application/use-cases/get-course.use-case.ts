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

  async execute(codigo: string): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findByCodigo(codigo);
    if (!course) {
      throw new CourseNotFoundError(codigo);
    }
    return CourseResponseDto.fromEntity(course);
  }
}
