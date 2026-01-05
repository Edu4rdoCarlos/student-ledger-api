import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma';
import { Notification } from '../../domain/entities';
import { NotificationStatus } from '../../domain/enums';
import { INotificationRepository } from '../../application/ports';
import { NotificationMapper } from './notification.mapper';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(notification: Notification): Promise<Notification> {
    const data = NotificationMapper.toPrisma(notification);
    const created = await this.prisma.notification.create({ data });
    return NotificationMapper.toDomain(created);
  }

  async findById(id: string): Promise<Notification | null> {
    const found = await this.prisma.notification.findUnique({ where: { id } });
    return found ? NotificationMapper.toDomain(found) : null;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map(NotificationMapper.toDomain);
  }

  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map(NotificationMapper.toDomain);
  }

  async update(notification: Notification): Promise<Notification> {
    const data = NotificationMapper.toPrisma(notification);
    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data,
    });
    return NotificationMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }
}
