import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma';
import { SendEmailUseCase } from './application/use-cases';
import {
  NOTIFICATION_REPOSITORY,
  EMAIL_PROVIDER,
} from './application/ports';
import { PrismaNotificationRepository } from './infra/persistence';
import { SmtpEmailAdapter } from './infra/adapters/smtp-email.adapter';
import { EmailTemplateService } from './application/services';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: EMAIL_PROVIDER,
      useClass: SmtpEmailAdapter,
    },
    SendEmailUseCase,
    EmailTemplateService,
  ],
  exports: [SendEmailUseCase, EmailTemplateService, NOTIFICATION_REPOSITORY, EMAIL_PROVIDER],
})
export class NotificationsModule {}
