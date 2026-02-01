import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICourseRepository, COURSE_REPOSITORY } from '../ports';
import { Course } from '../../domain/entities';
import { CourseNotFoundError } from '../../domain/errors';
import { UpdateCourseDto, CourseResponseDto } from '../../presentation/dtos';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { Coordinator } from '../../../coordinators/domain/entities';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
  ) {}

  async execute(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.findCourse(id);

    if (dto.name !== undefined) {
      course.changeName(dto.name);
    }

    if (dto.coordinatorId !== undefined) {
      await this.handleCoordinatorChange(course, dto.coordinatorId, dto.active);
    }

    if (dto.active !== undefined) {
      await this.handleActiveStatusChange(course, dto.active);
    }

    const updated = await this.courseRepository.update(course);
    return CourseResponseDto.fromEntity(updated);
  }

  private async findCourse(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new CourseNotFoundError(id);
    }
    return course;
  }

  private async handleCoordinatorChange(
    course: Course,
    newCoordinatorId: string,
    activeStatus?: boolean,
  ): Promise<void> {
    await this.validateNewCoordinator(newCoordinatorId);

    const shouldActivateCourse = activeStatus === true || (course.active && activeStatus !== false);
    if (shouldActivateCourse && !course.active) {
      course.activate();
    }

    await this.deactivatePreviousCoordinator(course, newCoordinatorId);
    course.assignCoordinator(newCoordinatorId);
  }

  private async validateNewCoordinator(coordinatorId: string): Promise<void> {
    const coordinator = await this.coordinatorRepository.findById(coordinatorId);
    if (!coordinator) {
      throw new NotFoundException(`Coordenador não encontrado: ${coordinatorId}`);
    }

    if (!coordinator.isActive) {
      throw new BadRequestException('Coordenador está inativo');
    }
  }

  private async deactivatePreviousCoordinator(course: Course, newCoordinatorId: string): Promise<void> {
    if (!course.hasCoordinator() || course.isCoordinator(newCoordinatorId)) {
      return;
    }

    const previousCoordinator = await this.coordinatorRepository.findById(course.coordinatorId!);
    if (previousCoordinator) {
      previousCoordinator.deactivate();
      await this.coordinatorRepository.update(previousCoordinator);
    }
  }

  private async handleActiveStatusChange(course: Course, active: boolean): Promise<void> {
    if (active) {
      course.activate();
    } else {
      await this.deactivateCourseAndCoordinator(course);
    }
  }

  private async deactivateCourseAndCoordinator(course: Course): Promise<void> {
    course.deactivate();

    if (!course.hasCoordinator()) {
      return;
    }

    const coordinator = await this.coordinatorRepository.findById(course.coordinatorId!);
    if (coordinator) {
      coordinator.removeCourse();
      await this.coordinatorRepository.update(coordinator);
    }
  }
}
