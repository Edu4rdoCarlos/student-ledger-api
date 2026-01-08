import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { NotifyDefenseCanceledUseCase } from './notify-defense-canceled.use-case';

@Injectable()
export class CancelDefenseUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseCanceledUseCase: NotifyDefenseCanceledUseCase,
  ) {}

  async execute(defenseId: string): Promise<Defense> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    defense.cancel();

    const updatedDefense = await this.defenseRepository.update(defense);

    // Notificar todos os envolvidos
    await this.notifyDefenseCanceledUseCase.execute(defenseId);

    return updatedDefense;
  }
}
