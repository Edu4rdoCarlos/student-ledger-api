import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailParams } from '../../application/ports';

@Injectable()
export class SmtpEmailAdapter implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', user || '');
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Student Ledger');

    if (!user || !password) {
      this.logger.warn('SMTP credentials not configured. Email sending will fail.');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Failed to send email to ${params.to}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new Error(`Falha ao enviar email: ${errorMessage}`);
    }
  }
}
