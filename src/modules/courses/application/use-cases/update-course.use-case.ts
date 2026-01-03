import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseNotFoundError } from '../../domain/errors';
import { UpdateCourseDto, CourseResponseDto } from '../../presentation/dtos';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(codigo: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findByCodigo(codigo);
    if (!course) {
      throw new CourseNotFoundError(codigo);
    }

    course.update({
      nome: dto.nome,
      departamento: dto.departamento,
      ativo: dto.ativo,
      coordinatorId: dto.coordinatorId,
    });

    const updated = await this.courseRepository.update(course);
    return CourseResponseDto.fromEntity(updated);
  }
}
