import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../students/application/ports';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../../../advisors/application/ports';
import { ICoordinatorRepository, COORDINATOR_REPOSITORY } from '../../../coordinators/application/ports';
import { DEFENSE_REPOSITORY, IDefenseRepository } from '../../../defenses/application/ports';
import { Defense } from '../../../defenses/domain/entities';
import { DefenseResponseDto } from '../../../defenses/presentation/dtos/response/defense-response.dto';

@Injectable()
export class GetUserDefensesUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STUDENT_REPOSITORY)
    private readonly studentRepository: IStudentRepository,
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(COORDINATOR_REPOSITORY)
    private readonly coordinatorRepository: ICoordinatorRepository,
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(userId: string): Promise<DefenseResponseDto[]> {
    const user = await this.findAndValidateUser(userId);
    const defenses = await this.fetchDefensesByRole(userId, user.role);
    return defenses.map(DefenseResponseDto.fromEntity);
  }

  private async findAndValidateUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  private async fetchDefensesByRole(userId: string, role: string): Promise<Defense[]> {
    if (role === Role.STUDENT) {
      return this.fetchStudentDefenses(userId);
    } else if (role === Role.ADVISOR) {
      return this.fetchAdvisorDefenses(userId);
    } else if (role === Role.COORDINATOR) {
      return this.fetchCoordinatorDefenses(userId);
    }
    return [];
  }

  private async fetchStudentDefenses(userId: string): Promise<Defense[]> {
    const student = await this.studentRepository.findByUserId(userId);
    if (!student) return [];
    return this.defenseRepository.findByStudentId(student.id);
  }

  private async fetchAdvisorDefenses(userId: string): Promise<Defense[]> {
    const advisor = await this.advisorRepository.findByUserId(userId);
    if (!advisor) return [];
    return this.defenseRepository.findByAdvisorId(advisor.id);
  }

  private async fetchCoordinatorDefenses(userId: string): Promise<Defense[]> {
    const coordinator = await this.coordinatorRepository.findByUserId(userId);
    if (!coordinator) return [];
    return this.defenseRepository.findByAdvisorId(coordinator.id);
  }
}
