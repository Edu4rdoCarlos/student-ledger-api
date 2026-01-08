import { Injectable, Inject } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { NotifyDefenseRescheduledUseCase } from './notify-defense-rescheduled.use-case';

interface RescheduleDefenseRequest {
  defenseId: string;
  newDate: Date;
}

@Injectable()
export class RescheduleDefenseUseCase {
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseRescheduledUseCase: NotifyDefenseRescheduledUseCase,
  ) {}

  async execute(request: RescheduleDefenseRequest): Promise<Defense> {
    const defense = await this.defenseRepository.findById(request.defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    defense.reschedule(request.newDate);

    const updatedDefense = await this.defenseRepository.update(defense);

    // Notificar todos os envolvidos
    await this.notifyDefenseRescheduledUseCase.execute(request.defenseId);

    return updatedDefense;
  }
}
