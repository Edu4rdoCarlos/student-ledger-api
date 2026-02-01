import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { DocumentsModule } from '../documents/documents.module';
import { IpfsModule } from '../../toolkit/ipfs/ipfs.module';
import { NotificationsModule } from '../../toolkit/notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { HashUtil } from '../documents/infra/utils/hash.util';
import {
  CreateDefenseUseCase,
  GetDefenseUseCase,
  ListDefensesUseCase,
  UpdateDefenseUseCase,
  SubmitDefenseResultUseCase,
  NotifyDefenseScheduledUseCase,
  NotifyDefenseCanceledUseCase,
  NotifyDefenseRescheduledUseCase,
  NotifyDefenseResultUseCase,
  CancelDefenseUseCase,
  RescheduleDefenseUseCase,
} from './application/use-cases';
import { DEFENSE_REPOSITORY } from './application/ports';
import { PrismaDefenseRepository } from './infra/persistence';
import { DefenseController } from './presentation/http';
import { DefenseNotificationScheduler } from './infra/schedulers/defense-notification.scheduler';
import { FileUploadAdapter } from './infra/adapters/file-upload.adapter';

@Module({
  imports: [
    PrismaModule,
    StudentsModule,
    AdvisorsModule,
    CoursesModule,
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
    HashUtil,
    FileUploadAdapter,
    CreateDefenseUseCase,
    GetDefenseUseCase,
    ListDefensesUseCase,
    UpdateDefenseUseCase,
    SubmitDefenseResultUseCase,
    NotifyDefenseScheduledUseCase,
    NotifyDefenseCanceledUseCase,
    NotifyDefenseRescheduledUseCase,
    NotifyDefenseResultUseCase,
    CancelDefenseUseCase,
    RescheduleDefenseUseCase,
    DefenseNotificationScheduler,
  ],
  exports: [DEFENSE_REPOSITORY],
})
export class DefensesModule {}
