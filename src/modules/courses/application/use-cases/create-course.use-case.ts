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
    const codigoExists = await this.courseRepository.existsByCodigo(dto.codigo);
    if (codigoExists) {
      throw new CourseCodigoAlreadyExistsError(dto.codigo);
    }

    const course = Course.create({
      codigo: dto.codigo,
      nome: dto.nome,
      departamento: dto.departamento,
      ativo: dto.ativo ?? true,
      organizationId: dto.organizationId,
      coordinatorId: dto.coordinatorId,
    });

    const created = await this.courseRepository.create(course);
    return CourseResponseDto.fromEntity(created);
  }
}
