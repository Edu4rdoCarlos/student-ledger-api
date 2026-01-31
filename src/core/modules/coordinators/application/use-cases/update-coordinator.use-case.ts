import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { Coordinator } from '../../domain/entities';
import { UpdateCoordinatorDto, CoordinatorResponseDto } from '../../presentation/dtos';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { Course } from '../../../courses/domain/entities';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class UpdateCoordinatorUseCase {
  constructor(
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(userId: string, dto: UpdateCoordinatorDto): Promise<CoordinatorResponseDto> {
    const coordinator = await this.findCoordinator(userId);

    await this.updateName(coordinator, dto.name);
    await this.handleStatusAndCourseChanges(coordinator, dto, userId);

    const updated = await this.coordinatorRepository.update(coordinator);

    return CoordinatorResponseDto.fromEntity(updated);
  }

  private async findCoordinator(userId: string): Promise<Coordinator> {
    const coordinator = await this.coordinatorRepository.findById(userId);
    if (!coordinator) {
      throw new NotFoundException('Coordenador não encontrado');
    }
    return coordinator;
  }

  private async updateName(coordinator: Coordinator, name?: string): Promise<void> {
    if (!name || name === coordinator.name) {
      return;
    }

    coordinator.updateName(name);
    await this.userRepository.updateName(coordinator.id, name);
  }

  private async handleStatusAndCourseChanges(
    coordinator: Coordinator,
    dto: UpdateCoordinatorDto,
    userId: string,
  ): Promise<void> {
    const isChangingStatus = dto.isActive !== undefined && dto.isActive !== coordinator.isActive;

    if (isChangingStatus) {
      await this.handleStatusChange(coordinator, dto, userId);
    } else if (dto.courseId && dto.isActive !== false) {
      await this.handleCourseChange(coordinator, dto.courseId, userId);
    }
  }

  private async handleStatusChange(
    coordinator: Coordinator,
    dto: UpdateCoordinatorDto,
    userId: string,
  ): Promise<void> {
    if (!dto.isActive) {
      coordinator.deactivate();
      return;
    }

    await this.activateWithCourse(coordinator, dto.courseId, userId);
  }

  private async activateWithCourse(
    coordinator: Coordinator,
    courseId: string | undefined,
    userId: string,
  ): Promise<void> {
    if (!courseId) {
      throw new NotFoundException('Curso é obrigatório para ativar um coordenador');
    }

    const course = await this.validateAndGetCourse(courseId, userId);

    coordinator.activate();
    coordinator.updateCourse(course.id);
  }

  private async handleCourseChange(
    coordinator: Coordinator,
    courseId: string,
    userId: string,
  ): Promise<void> {
    if (courseId === coordinator.courseId) {
      return;
    }

    const course = await this.validateAndGetCourse(courseId, userId);
    coordinator.updateCourse(course.id);
  }

  private async validateAndGetCourse(courseId: string, currentUserId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!course.active) {
      throw new BadRequestException('Não é possível atribuir um coordenador a um curso inativo');
    }

    await this.validateCourseHasNoActiveCoordinator(courseId, currentUserId);

    return course;
  }

  private async validateCourseHasNoActiveCoordinator(
    courseId: string,
    currentUserId: string,
  ): Promise<void> {
    const existingCoordinator = await this.coordinatorRepository.findByCourseId(courseId);

    const hasOtherActiveCoordinator =
      existingCoordinator &&
      existingCoordinator.userId !== currentUserId &&
      existingCoordinator.isActive;

    if (hasOtherActiveCoordinator) {
      throw new ConflictException(
        'Este curso já possui um coordenador ativo. Inative o coordenador atual antes de atribuir um novo.',
      );
    }
  }
}
