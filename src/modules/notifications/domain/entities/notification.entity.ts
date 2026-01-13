import { NotificationChannel, NotificationContextType, NotificationStatus } from '../enums';

export interface NotificationProps {
  userId?: string;
  channel: NotificationChannel;
  to: string;
  subject?: string;
  templateId?: string;
  data?: Record<string, any>;
  contextType?: NotificationContextType;
  contextId?: string;
  status: NotificationStatus;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: Date;
  updatedAt?: Date;
  sentAt?: Date;
}

export class Notification {
  private readonly _id: string;
  private props: NotificationProps;

  private constructor(props: NotificationProps, id?: string) {
    this._id = id ?? crypto.randomUUID();
    this.props = {
      ...props,
      retryCount: props.retryCount ?? 0,
      maxRetries: props.maxRetries ?? 3,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  static create(props: NotificationProps, id?: string): Notification {
    const notification = new Notification(props, id);
    notification.validate();
    return notification;
  }

  private validate(): void {
    if (!this.props.to || !this.props.to.includes('@')) {
      throw new Error('Email inválido');
    }

    if (this.props.channel !== NotificationChannel.EMAIL) {
      throw new Error('Apenas notificações por email são suportadas');
    }
  }

  get id(): string {
    return this._id;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get channel(): NotificationChannel {
    return this.props.channel;
  }

  get to(): string {
    return this.props.to;
  }

  get subject(): string | undefined {
    return this.props.subject;
  }

  get templateId(): string | undefined {
    return this.props.templateId;
  }

  get data(): Record<string, any> | undefined {
    return this.props.data;
  }

  get contextType(): NotificationContextType | undefined {
    return this.props.contextType;
  }

  get contextId(): string | undefined {
    return this.props.contextId;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  get error(): string | undefined {
    return this.props.error;
  }

  get retryCount(): number {
    return this.props.retryCount!;
  }

  get maxRetries(): number {
    return this.props.maxRetries!;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  markAsProcessing(): void {
    this.props.status = NotificationStatus.PROCESSING;
    this.touch();
  }

  markAsSent(): void {
    this.props.status = NotificationStatus.SENT;
    this.props.sentAt = new Date();
    this.touch();
  }

  markAsFailed(error: string): void {
    this.props.status = NotificationStatus.FAILED;
    this.props.error = error;
    this.props.retryCount = (this.props.retryCount ?? 0) + 1;
    this.touch();
  }

  markForRetry(error: string): void {
    this.props.status = NotificationStatus.RETRY;
    this.props.error = error;
    this.props.retryCount = (this.props.retryCount ?? 0) + 1;
    this.touch();
  }

  canRetry(): boolean {
    return (this.props.retryCount ?? 0) < (this.props.maxRetries ?? 3);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
