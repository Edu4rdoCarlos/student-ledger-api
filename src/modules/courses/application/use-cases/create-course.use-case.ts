import { Inject, Injectable } from '@nestjs/common';
import { Course } from '../../domain/entities';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseCodeAlreadyExistsError } from '../../domain/errors';
import { CreateCourseDto, CourseResponseDto } from '../../presentation/dtos';

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const codeExists = await this.courseRepository.existsByCode(dto.code);
    if (codeExists) {
      throw new CourseCodeAlreadyExistsError(dto.code);
    }

    const course = Course.create({
      code: dto.code,
      name: dto.name,
      departmentId: dto.departmentId,
      active: dto.active ?? true,
      coordinatorId: dto.coordinatorId,
    });

    const created = await this.courseRepository.create(course);
    return CourseResponseDto.fromEntity(created);
  }
}
