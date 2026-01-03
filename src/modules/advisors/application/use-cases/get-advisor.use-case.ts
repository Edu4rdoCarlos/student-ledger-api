import { Inject, Injectable } from '@nestjs/common';
import { IAdvisorRepository, ADVISOR_REPOSITORY } from '../ports';
import { AdvisorNotFoundError } from '../../domain/errors';
import { AdvisorResponseDto } from '../../presentation/dtos';

@Injectable()
export class GetAdvisorUseCase {
  constructor(
    @Inject(ADVISOR_REPOSITORY)
    private readonly advisorRepository: IAdvisorRepository,
  ) {}

  async execute(id: string): Promise<AdvisorResponseDto> {
    const advisor = await this.advisorRepository.findById(id);
    if (!advisor) {
      throw new AdvisorNotFoundError(id);
    }
    return AdvisorResponseDto.fromEntity(advisor);
  }
}
