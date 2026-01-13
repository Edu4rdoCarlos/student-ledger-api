import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let defenses: Defense[] = [];

    if (user.role === 'STUDENT') {
      const student = await this.studentRepository.findByUserId(userId);
      if (student) {
        defenses = await this.defenseRepository.findByStudentId(student.id);
      }
    } else if (user.role === 'ADVISOR') {
      const advisor = await this.advisorRepository.findByUserId(userId);
      if (advisor) {
        defenses = await this.defenseRepository.findByAdvisorId(advisor.id);
      }
    } else if (user.role === 'COORDINATOR') {
      const coordinator = await this.coordinatorRepository.findByUserId(userId);
      if (coordinator) {
        defenses = await this.defenseRepository.findByAdvisorId(coordinator.id);
      }
    }

    return defenses.map(DefenseResponseDto.fromEntity);
  }
}
