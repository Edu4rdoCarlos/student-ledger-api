import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { CourseNotFoundError } from '../../domain/errors';
import { UpdateCourseDto, CourseResponseDto } from '../../presentation/dtos';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
  ) {}

  async execute(code: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findByCode(code);
    if (!course) {
      throw new CourseNotFoundError(code);
    }

    if (dto.coordinatorId !== undefined) {
      const newCoordinator = await this.coordinatorRepository.findById(dto.coordinatorId);
      if (!newCoordinator) {
        throw new NotFoundException(`Coordenador não encontrado: ${dto.coordinatorId}`);
      }

      if (!newCoordinator.isActive) {
        throw new BadRequestException('Coordenador está inativo');
      }

      if (course.coordinatorId && course.coordinatorId !== dto.coordinatorId) {
        const previousCoordinator = await this.coordinatorRepository.findById(course.coordinatorId);
        if (previousCoordinator) {
          previousCoordinator.deactivate();
          await this.coordinatorRepository.update(previousCoordinator);
        }
      }
    }

    course.update({
      name: dto.name,
      active: dto.active,
      coordinatorId: dto.coordinatorId,
    });

    const updated = await this.courseRepository.update(course);
    return CourseResponseDto.fromEntity(updated);
  }
}
