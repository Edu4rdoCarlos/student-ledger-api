import { Inject, Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../ports';
import { UpdateCoordinatorDto, CoordinatorResponseDto } from '../../presentation/dtos';
import { ICourseRepository, COURSE_REPOSITORY } from '../../../courses/application/ports';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class UpdateCoordinatorUseCase {
  private readonly logger = new Logger(UpdateCoordinatorUseCase.name);

  constructor(
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async execute(userId: string, dto: UpdateCoordinatorDto): Promise<CoordinatorResponseDto> {
    const coordinator = await this.coordinatorRepository.findById(userId);

    if (!coordinator) {
      throw new NotFoundException('Coordenador não encontrado');
    }

    // Atualizar nome se necessário
    if (dto.name && dto.name !== coordinator.name) {
      coordinator.updateName(dto.name);
      // Atualizar também na tabela de usuários
      await this.userRepository.updateName(userId, dto.name);
    }

    // Verificar se está desativando
    if (dto.isActive !== undefined && dto.isActive !== coordinator.isActive) {
      if (!dto.isActive) {
        // Ao desativar, remove o vínculo com o curso
        coordinator.deactivate();
      } else {
        // Ao ativar, precisa ter um curso válido
        if (!dto.courseId) {
          throw new NotFoundException(`Curso é obrigatório para ativar um coordenador`);
        }

        const courseExists = await this.courseRepository.findById(dto.courseId);
        if (!courseExists) {
          throw new NotFoundException(`Curso não encontrado`);
        }

        if (!courseExists.active) {
          throw new BadRequestException('Não é possível atribuir um coordenador a um curso inativo');
        }

        // Verificar se o curso já tem um coordenador ativo
        const existingCoordinator = await this.coordinatorRepository.findByCourseId(dto.courseId);
        if (existingCoordinator && existingCoordinator.userId !== userId && existingCoordinator.isActive) {
          throw new ConflictException('Este curso já possui um coordenador ativo. Inative o coordenador atual antes de atribuir um novo.');
        }

        coordinator.activate();
        coordinator.updateCourse(courseExists.id);
      }
    } else if (dto.isActive !== false && dto.courseId) {
      // Se não está desativando e tem courseId, verificar mudança de curso
      const courseExists = await this.courseRepository.findById(dto.courseId);
      if (!courseExists) {
        throw new NotFoundException(`Curso não encontrado`);
      }

      if (!courseExists.active) {
        throw new BadRequestException('Não é possível atribuir um coordenador a um curso inativo');
      }

      // Se mudou o curso, verificar se o novo curso já tem coordenador ativo
      if (dto.courseId !== coordinator.courseId) {
        const existingCoordinator = await this.coordinatorRepository.findByCourseId(dto.courseId);

        if (existingCoordinator && existingCoordinator.userId !== userId && existingCoordinator.isActive) {
          throw new ConflictException('Este curso já possui um coordenador ativo. Inative o coordenador atual antes de atribuir um novo.');
        }

        coordinator.updateCourse(courseExists.id);
      }
    }

    const updated = await this.coordinatorRepository.update(coordinator);

    this.logger.log(`Coordenador ${userId} atualizado com sucesso`);

    return CoordinatorResponseDto.fromEntity(updated);
  }
}
