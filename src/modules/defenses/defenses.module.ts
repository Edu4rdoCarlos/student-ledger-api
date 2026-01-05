import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { DocumentsModule } from '../documents/documents.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { MongoStorageService } from '../../database/mongo';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SubmitDefenseResultUseCase,
  NotifyDefenseScheduledUseCase,
  NotifyDefenseResultUseCase,
} from './application/use-cases';
import { DEFENSE_REPOSITORY } from './application/ports';
import { PrismaDefenseRepository } from './infra/persistence';
import { DefenseController } from './presentation/http';
import { DefenseNotificationScheduler } from './infra/schedulers/defense-notification.scheduler';

@Module({
  imports: [
    PrismaModule,
    StudentsModule,
    AdvisorsModule,
    forwardRef(() => DocumentsModule),
    forwardRef(() => require('../approvals/approvals.module').ApprovalsModule),
    IpfsModule,
    NotificationsModule,
    AuthModule,
  ],
  controllers: [DefenseController],
  providers: [
    {
      provide: DEFENSE_REPOSITORY,
      useClass: PrismaDefenseRepository,
    },
    MongoStorageService,
    CreateDefenseUseCase,
    GetDefenseUseCase,
    ListDefensesUseCase,
    UpdateDefenseUseCase,
    SubmitDefenseResultUseCase,
    NotifyDefenseScheduledUseCase,
    NotifyDefenseResultUseCase,
    DefenseNotificationScheduler,
  ],
  exports: [DEFENSE_REPOSITORY],
})
export class DefensesModule {}
