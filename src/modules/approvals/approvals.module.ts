import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma';
import { DefensesModule } from '../defenses/defenses.module';
import { DocumentsModule } from '../documents/documents.module';
import { StudentsModule } from '../students/students.module';
import { AdvisorsModule } from '../advisors/advisors.module';
import { CoordinatorsModule } from '../coordinators/coordinators.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FabricModule } from '../fabric/fabric.module';
import {
  CreateApprovalsUseCase,
  ApproveDocumentUseCase,
  RejectDocumentUseCase,
  OverrideRejectionUseCase,
  RegisterOnBlockchainUseCase,
  ListPendingApprovalsUseCase,
  NotifyApproverUseCase,
} from './application/use-cases';
import { APPROVAL_REPOSITORY } from './application/ports';
import { PrismaApprovalRepository } from './infra/persistence';
import { ApprovalController } from './presentation/http';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => DefensesModule),
    forwardRef(() => DocumentsModule),
    StudentsModule,
    AdvisorsModule,
    CoordinatorsModule,
    AuthModule,
    NotificationsModule,
    FabricModule,
  ],
  controllers: [ApprovalController],
  providers: [
    {
      provide: APPROVAL_REPOSITORY,
      useClass: PrismaApprovalRepository,
    },
    CreateApprovalsUseCase,
    ApproveDocumentUseCase,
    RejectDocumentUseCase,
    OverrideRejectionUseCase,
    RegisterOnBlockchainUseCase,
    ListPendingApprovalsUseCase,
    NotifyApproverUseCase,
  ],
  exports: [
    APPROVAL_REPOSITORY,
    CreateApprovalsUseCase,
    ApproveDocumentUseCase,
    RejectDocumentUseCase,
    OverrideRejectionUseCase,
    RegisterOnBlockchainUseCase,
    ListPendingApprovalsUseCase,
    NotifyApproverUseCase,
  ],
})
export class ApprovalsModule {}
