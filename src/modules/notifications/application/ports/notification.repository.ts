import { Notification } from '../../domain/entities';
import { NotificationStatus } from '../../domain/enums';

export interface INotificationRepository {
  create(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string): Promise<Notification[]>;
  findByStatus(status: NotificationStatus): Promise<Notification[]>;
  update(notification: Notification): Promise<Notification>;
  delete(id: string): Promise<void>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');
