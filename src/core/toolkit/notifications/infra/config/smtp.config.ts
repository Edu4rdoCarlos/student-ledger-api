import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmtpConfiguration {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

@Injectable()
export class SmtpConfigService {
  private readonly logger = new Logger(SmtpConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  getConfiguration(): SmtpConfiguration {
    const user = this.configService.get<string>('GOOGLE_SMTP_USER');
    const password = this.configService.get<string>('GOOGLE_SMTP_PASSWORD');

    this.validateCredentials(user, password);

    return {
      host: this.configService.get<string>('GOOGLE_SMTP_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get<string>('GOOGLE_SMTP_PORT', '587')),
      secure: this.configService.get<string>('GOOGLE_SMTP_SECURE', 'false') === 'true',
      user: user!,
      password: password!,
      fromEmail: this.configService.get<string>('GOOGLE_SMTP_FROM_EMAIL', user || ''),
      fromName: this.configService.get<string>('GOOGLE_SMTP_FROM_NAME', 'Academic Ledger'),
    };
  }

  private validateCredentials(user: string | undefined, password: string | undefined): void {
    if (!user || !password) {
      this.logger.warn('SMTP credentials not configured. Email sending will fail.');
    }
  }
}
