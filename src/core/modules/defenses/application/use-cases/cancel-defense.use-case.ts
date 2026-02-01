import { Injectable, Inject, Logger } from '@nestjs/common';
import { Defense } from '../../domain/entities';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../ports';
import { DefenseNotFoundError } from '../../domain/errors';
import { NotifyDefenseCanceledUseCase } from './notify-defense-canceled.use-case';

export interface CancelDefenseRequest {
  defenseId: string;
  cancellationReason: string;
}

@Injectable()
export class CancelDefenseUseCase {
  private readonly logger = new Logger(CancelDefenseUseCase.name);

  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseCanceledUseCase: NotifyDefenseCanceledUseCase,
  ) {}

  async execute(request: CancelDefenseRequest): Promise<Defense> {
    const defense = await this.findAndValidateDefense(request.defenseId);
    defense.cancel(request.cancellationReason);
    const updatedDefense = await this.defenseRepository.update(defense);

    await this.createCancellationEvent(request.defenseId, request.cancellationReason);
    this.sendCancelNotification(request.defenseId);

    return updatedDefense;
  }

  private async findAndValidateDefense(defenseId: string): Promise<Defense> {
    const defense = await this.defenseRepository.findById(defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }
    return defense;
  }

  private async createCancellationEvent(defenseId: string, reason: string): Promise<void> {
    await this.defenseRepository.createEvent({
      defenseId,
      type: 'CANCELED',
      reason,
    });
  }

  private sendCancelNotification(defenseId: string): void {
    this.notifyDefenseCanceledUseCase.execute(defenseId).catch((error) => {
      this.logger.error(`Falha ao enviar notificação de cancelamento: ${error.message}`);
    });
  }
}
