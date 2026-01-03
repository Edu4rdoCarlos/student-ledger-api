import { Injectable, Inject } from '@nestjs/common';
import { IDefenseRepository, DEFENSE_REPOSITORY, FindAllOptions, FindAllResult } from '../ports';

@Injectable()
export class ListDefensesUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
  ) {}

  async execute(options?: FindAllOptions): Promise<FindAllResult> {
    return this.defenseRepository.findAll(options);
  }
}
