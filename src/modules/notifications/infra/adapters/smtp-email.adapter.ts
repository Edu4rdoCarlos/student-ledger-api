import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailParams } from '../../application/ports';
import { EmailTemplateService } from '../../application/services';

@Injectable()
export class SmtpEmailAdapter implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    const host = this.configService.get<string>('GOOGLE_SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('GOOGLE_SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('GOOGLE_SMTP_SECURE', false);
    const user = this.configService.get<string>('GOOGLE_SMTP_USER');
    const password = this.configService.get<string>('GOOGLE_SMTP_PASSWORD');

    this.fromEmail = this.configService.get<string>('GOOGLE_SMTP_FROM_EMAIL', user || '');
    this.fromName = this.configService.get<string>('GOOGLE_SMTP_FROM_NAME', 'Student Ledger');

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
      let subject = params.subject;
      let html = params.html;
      let text = params.text;

      // If template is provided, generate content from template
      if (params.template) {
        const templateResult = this.emailTemplateService.generateTemplate(
          params.template.id as any,
          params.template.data,
        );
        subject = templateResult.subject;
        html = templateResult.html;
      }

      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent successfully to ${params.to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Failed to send email to ${params.to}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new Error(`Falha ao enviar email: ${errorMessage}`);
    }
  }
}
