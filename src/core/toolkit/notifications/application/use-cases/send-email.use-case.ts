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
  userId?: string;
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
    const notification = this.createNotification(request);
    const savedNotification = await this.saveAndMarkAsProcessing(notification);

    try {
      await this.sendEmail(request);
      return await this.handleSuccess(savedNotification);
    } catch (error) {
      await this.handleError(savedNotification, error);
      throw error;
    }
  }

  private createNotification(request: SendEmailRequest): Notification {
    return Notification.create({
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
  }

  private async saveAndMarkAsProcessing(notification: Notification): Promise<Notification> {
    const saved = await this.notificationRepository.create(notification);
    saved.markAsProcessing();
    return await this.notificationRepository.update(saved);
  }

  private async sendEmail(request: SendEmailRequest): Promise<void> {
    await this.emailProvider.sendEmail({
      to: request.to,
      subject: request.subject,
      html: request.html,
      text: request.text,
      template: request.template,
    });
  }

  private async handleSuccess(notification: Notification): Promise<Notification> {
    notification.markAsSent();
    return await this.notificationRepository.update(notification);
  }

  private async handleError(notification: Notification, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar email';

    if (notification.canRetry()) {
      notification.markForRetry(errorMessage);
    } else {
      notification.markAsFailed(errorMessage);
    }

    await this.notificationRepository.update(notification);
  }
}
