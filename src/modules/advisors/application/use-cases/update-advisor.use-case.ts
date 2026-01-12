import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorNotFoundError } from '../../domain/errors';
import { UpdateAdvisorDto, AdvisorResponseDto } from '../../presentation/dtos';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/application/ports';

@Injectable()
export class UpdateAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateAdvisorDto): Promise<AdvisorResponseDto> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new AdvisorNotFoundError(id);
    }

    if (dto.name !== undefined) {
      await this.userRepository.updateName(advisor.userId, dto.name);
    }

    if (dto.specialization !== undefined || dto.courseId !== undefined || dto.isActive !== undefined) {
      advisor.update({
        specialization: dto.specialization,
        courseId: dto.courseId,
        isActive: dto.isActive,
      });
      await this.advisorRepository.update(advisor);
    }

    const updated = await this.advisorRepository.findById(id);
    return AdvisorResponseDto.fromEntity(updated!);
  }
}
