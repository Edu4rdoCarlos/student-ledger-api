import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';

interface SetGradeRequest {
  id: string;
  finalGrade: number;
}

@Injectable()
export class SetGradeUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(request: SetGradeRequest): Promise<Defense> {
    const defense = await this.defenseRepository.findById(request.id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    defense.setGrade(request.finalGrade);

    return this.defenseRepository.update(defense);
  }
}
