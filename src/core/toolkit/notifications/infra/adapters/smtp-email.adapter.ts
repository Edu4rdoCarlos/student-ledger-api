import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailProvider, SendEmailParams } from '../../application/ports';
import { EmailTemplateRenderer } from '../templates';
import { SmtpConfigService } from '../config';

@Injectable()
export class SmtpEmailAdapter implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private readonly smtpConfig: SmtpConfigService,
    private readonly emailTemplateRenderer: EmailTemplateRenderer,
  ) {
    const config = this.smtpConfig.getConfiguration();

    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.transporter = this.createTransporter(config);
  }

  private createTransporter(config: ReturnType<SmtpConfigService['getConfiguration']>): Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    try {
      const { subject, html, text } = this.prepareEmailContent(params);

      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: params.to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent successfully to ${params.to}`);
    } catch (error) {
      this.handleSendError(params.to, error);
    }
  }

  private prepareEmailContent(params: SendEmailParams) {
    if (params.template) {
      const templateResult = this.emailTemplateRenderer.generateTemplate(
        params.template.id as any,
        params.template.data,
      );
      return {
        subject: templateResult.subject,
        html: templateResult.html,
        text: params.text,
      };
    }

    return {
      subject: params.subject,
      html: params.html,
      text: params.text,
    };
  }

  private handleSendError(recipient: string, error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    this.logger.error(
      `Failed to send email to ${recipient}: ${errorMessage}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw new Error(`Falha ao enviar email: ${errorMessage}`);
  }
}
