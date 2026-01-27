import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorNotFoundError } from '../../domain/errors';
import { UpdateAdvisorInput } from '../dtos';
import { Advisor } from '../../domain/entities';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class UpdateAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, input: UpdateAdvisorInput): Promise<Advisor> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new AdvisorNotFoundError(id);
    }

    if (input.name !== undefined) {
      await this.userRepository.updateName(advisor.userId, input.name);
    }

    const hasAdvisorChanges =
      input.specialization !== undefined ||
      input.courseId !== undefined ||
      input.isActive !== undefined;

    if (hasAdvisorChanges) {
      advisor.update({
        specialization: input.specialization,
        courseId: input.courseId,
        isActive: input.isActive,
      });
      return this.advisorRepository.update(advisor);
    }

    return advisor;
  }
}
