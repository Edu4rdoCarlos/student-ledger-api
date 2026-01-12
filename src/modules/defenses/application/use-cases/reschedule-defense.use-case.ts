import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../../shared/services/prisma.service';
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
  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseRescheduledUseCase: NotifyDefenseRescheduledUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(request: RescheduleDefenseRequest): Promise<Defense> {
    const defense = await this.defenseRepository.findById(request.defenseId);
    if (!defense) {
      throw new DefenseNotFoundError();
    }

    const oldDate = defense.defenseDate;

    defense.reschedule(request.newDate, request.rescheduleReason);

    const updatedDefense = await this.defenseRepository.update(defense);

    await this.prisma.defenseEvent.create({
      data: {
        defenseId: request.defenseId,
        type: 'RESCHEDULED',
        reason: request.rescheduleReason,
        metadata: {
          oldDate: oldDate.toISOString(),
          newDate: request.newDate.toISOString(),
        },
      },
    });

    await this.notifyDefenseRescheduledUseCase.execute(request.defenseId);

    return updatedDefense;
  }
}
