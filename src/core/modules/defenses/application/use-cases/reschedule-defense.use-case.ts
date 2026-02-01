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
    const defense = await this.findAndValidateDefense(request.defenseId);
    const oldDate = defense.defenseDate;

    defense.reschedule(request.newDate, request.rescheduleReason);
    const updatedDefense = await this.defenseRepository.update(defense);

    await this.createRescheduleEvent(request.defenseId, request.rescheduleReason, oldDate, request.newDate);
    this.sendRescheduleNotification(request.defenseId);

    return updatedDefense;
  }

  private async findAndValidateDefense(defenseId: string): Promise<Defense> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }
    return defense;
  }

  private async createRescheduleEvent(defenseId: string, reason: string, oldDate: Date, newDate: Date): Promise<void> {
    await this.defenseRepository.createEvent({
      defenseId,
      type: 'RESCHEDULED',
      reason,
      metadata: {
        oldDate: oldDate.toISOString(),
        newDate: newDate.toISOString(),
      },
    });
  }

  private sendRescheduleNotification(defenseId: string): void {
    this.notifyDefenseRescheduledUseCase.execute(defenseId).catch((error) => {
      this.logger.error(`Falha ao enviar notificação de reagendamento: ${error.message}`);
    });
  }
}
