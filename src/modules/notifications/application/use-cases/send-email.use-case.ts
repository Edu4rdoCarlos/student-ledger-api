import { Injectable, Inject } from '@nestjs/common';
import { Notification } from '../../domain/entities';
import { NotificationChannel, NotificationContextType, NotificationStatus } from '../../domain/enums';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
  IEmailProvider,
  EMAIL_PROVIDER,
  SendEmailParams,
} from '../ports';

interface SendEmailRequest {
  userId: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: {
    id: string;
    data: Record<string, any>;
  };
  contextType?: NotificationContextType;
  contextId?: string;
}

@Injectable()
export class SendEmailUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(request: SendEmailRequest): Promise<Notification> {
    // Create notification record
    const notification = Notification.create({
      userId: request.userId,
      channel: NotificationChannel.EMAIL,
      to: request.to,
      subject: request.subject,
      templateId: request.template?.id,
      data: request.template?.data,
      contextType: request.contextType,
      contextId: request.contextId,
      status: NotificationStatus.PENDING,
    });

    // Save notification
    const savedNotification = await this.notificationRepository.create(notification);

    // Mark as processing
    savedNotification.markAsProcessing();
    await this.notificationRepository.update(savedNotification);

    try {
      // Send email
      await this.emailProvider.sendEmail({
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text,
        template: request.template,
      });

      // Mark as sent
      savedNotification.markAsSent();
      return await this.notificationRepository.update(savedNotification);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar email';

      if (savedNotification.canRetry()) {
        savedNotification.markForRetry(errorMessage);
      } else {
        savedNotification.markAsFailed(errorMessage);
      }

      await this.notificationRepository.update(savedNotification);
      throw error;
    }
  }
}
