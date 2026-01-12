import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma';
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
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseCanceledUseCase: NotifyDefenseCanceledUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(request: CancelDefenseRequest): Promise<Defense> {
    const defense = await this.defenseRepository.findById(request.defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    defense.cancel(request.cancellationReason);

    const updatedDefense = await this.defenseRepository.update(defense);

    await this.prisma.defenseEvent.create({
      data: {
        defenseId: request.defenseId,
        type: 'CANCELED',
        reason: request.cancellationReason,
      },
    });

    await this.notifyDefenseCanceledUseCase.execute(request.defenseId);

    return updatedDefense;
  }
}
