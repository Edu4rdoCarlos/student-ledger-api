import { Notification as PrismaNotification } from '@prisma/client';
import { Notification } from '../../domain/entities';
import {
  NotificationChannel,
  NotificationContextType,
  NotificationStatus,
} from '../../domain/enums';

export class NotificationMapper {
  static toDomain(prisma: PrismaNotification): Notification {
    return Notification.create(
      {
        userId: prisma.userId,
        channel: prisma.channel as NotificationChannel,
        to: prisma.to,
        subject: prisma.subject ?? undefined,
        templateId: prisma.templateId ?? undefined,
        data: prisma.data as Record<string, any> | undefined,
        contextType: prisma.contextType as NotificationContextType | undefined,
        contextId: prisma.contextId ?? undefined,
        status: prisma.status as NotificationStatus,
        error: prisma.error ?? undefined,
        retryCount: prisma.retryCount,
        maxRetries: prisma.maxRetries,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
        sentAt: prisma.sentAt ?? undefined,
      },
      prisma.id,
    );
  }

  static toPrisma(notification: Notification) {
    return {
      id: notification.id,
      userId: notification.userId,
      channel: notification.channel,
      to: notification.to,
      subject: notification.subject ?? null,
      templateId: notification.templateId ?? null,
      data: notification.data ? JSON.parse(JSON.stringify(notification.data)) : null,
      contextType: notification.contextType ?? null,
      contextId: notification.contextId ?? null,
      status: notification.status,
      error: notification.error ?? null,
      retryCount: notification.retryCount,
      maxRetries: notification.maxRetries,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      sentAt: notification.sentAt ?? null,
    };
  }
}
