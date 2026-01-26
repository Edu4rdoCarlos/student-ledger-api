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

  async execute(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new CourseNotFoundError(id);
    }

    if (dto.coordinatorId !== undefined) {
      const newCoordinator = await this.coordinatorRepository.findById(dto.coordinatorId);
      if (!newCoordinator) {
        throw new NotFoundException(`Coordenador não encontrado: ${dto.coordinatorId}`);
      }

      if (!newCoordinator.isActive) {
        throw new BadRequestException('Coordenador está inativo');
      }

      const courseWillBeInactive = dto.active === false || (!course.active && dto.active !== true);
      if (courseWillBeInactive) {
        throw new BadRequestException('Não é possível atribuir um coordenador a um curso inativo');
      }

      if (course.coordinatorId && course.coordinatorId !== dto.coordinatorId) {
        const previousCoordinator = await this.coordinatorRepository.findById(course.coordinatorId);
        if (previousCoordinator) {
          previousCoordinator.deactivate();
          await this.coordinatorRepository.update(previousCoordinator);
        }
      }
    }

    if (dto.active === false && course.coordinatorId) {
      const coordinator = await this.coordinatorRepository.findById(course.coordinatorId);
      if (coordinator) {
        coordinator.removeCourse();
        await this.coordinatorRepository.update(coordinator);
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
