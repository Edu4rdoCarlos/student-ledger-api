import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';

@Injectable()
export class GetDefenseUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(id: string): Promise<Defense> {
    const defense = await this.defenseRepository.findById(id);
    if (!defense) {
      throw new DefenseNotFoundError();
    }
    return defense;
  }
}
