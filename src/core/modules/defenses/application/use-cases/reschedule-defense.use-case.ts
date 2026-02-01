import { Injectable, Inject, Logger } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { NotifyDefenseRescheduledUseCase } from './notify-defense-rescheduled.use-case';

interface RescheduleDefenseRequest {
  defenseId: string;
  newDate: Date;
  rescheduleReason: string;
}

@Injectable()
export class RescheduleDefenseUseCase {
  private readonly logger = new Logger(RescheduleDefenseUseCase.name);

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

    const oldDate = defense.defenseDate;

    defense.reschedule(request.newDate, request.rescheduleReason);
    const updatedDefense = await this.defenseRepository.update(defense);

    await this.defenseRepository.createEvent({
      defenseId: request.defenseId,
      type: 'RESCHEDULED',
      reason: request.rescheduleReason,
      metadata: {
        oldDate: oldDate.toISOString(),
        newDate: request.newDate.toISOString(),
      },
    });

    this.notifyDefenseRescheduledUseCase
      .execute(request.defenseId)
      .catch((error) => {
        this.logger.error(`Falha ao enviar notificação de reagendamento: ${error.message}`);
      });

    return updatedDefense;
  }
}
