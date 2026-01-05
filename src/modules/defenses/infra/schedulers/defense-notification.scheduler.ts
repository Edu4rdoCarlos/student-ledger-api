import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IDefenseRepository, DEFENSE_REPOSITORY } from '../../application/ports';
import { NotifyDefenseScheduledUseCase } from '../../application/use-cases';

@Injectable()
export class DefenseNotificationScheduler {
  private readonly logger = new Logger(DefenseNotificationScheduler.name);
  private notifiedDefenses = new Set<string>();

  constructor(
    @Inject(DEFENSE_REPOSITORY)
    private readonly defenseRepository: IDefenseRepository,
    private readonly notifyDefenseScheduledUseCase: NotifyDefenseScheduledUseCase,
  ) {}

  /**
   * Runs every day at 8 AM to check for defenses scheduled for today
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDefensesScheduledForToday() {
    this.logger.log('Checking for defenses scheduled for today...');

    try {
      const { items: defenses } = await this.defenseRepository.findAll({
        result: 'PENDING',
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const defense of defenses) {
        const defenseDate = new Date(defense.defenseDate);
        defenseDate.setHours(0, 0, 0, 0);

        // Check if defense is today and hasn't been notified yet
        if (
          defenseDate >= today &&
          defenseDate < tomorrow &&
          !this.notifiedDefenses.has(defense.id)
        ) {
          this.logger.log(`Notifying about defense: ${defense.id} - ${defense.title}`);

          try {
            await this.notifyDefenseScheduledUseCase.execute(defense.id);
            this.notifiedDefenses.add(defense.id);
            this.logger.log(`Successfully notified about defense: ${defense.id}`);
          } catch (error) {
            this.logger.error(
              `Failed to notify about defense ${defense.id}: ${error.message}`,
              error.stack
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking defenses:', error);
    }
  }

  /**
   * Clear the notified defenses set every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearNotifiedDefenses() {
    this.logger.log('Clearing notified defenses set');
    this.notifiedDefenses.clear();
  }
}
