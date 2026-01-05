import { Inject, Injectable } from '@nestjs/common';
import { Course } from '../../domain/entities';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseCodigoAlreadyExistsError } from '../../domain/errors';
import { CreateCourseDto, CourseResponseDto } from '../../presentation/dtos';

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const codigoExists = await this.courseRepository.existsByCodigo(dto.code);
    if (codigoExists) {
      throw new CourseCodigoAlreadyExistsError(dto.code);
    }

    const course = Course.create({
      codigo: dto.code,
      nome: dto.name,
      departmentId: dto.departmentId,
      ativo: dto.active ?? true,
      coordinatorId: dto.coordinatorId,
    });

    const created = await this.courseRepository.create(course);
    return CourseResponseDto.fromEntity(created);
  }
}
