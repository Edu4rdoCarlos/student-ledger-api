export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: {
    id: string;
    data: Record<string, any>;
  };
}

export interface IEmailProvider {
  sendEmail(params: SendEmailParams): Promise<void>;
}

export const EMAIL_PROVIDER = Symbol('IEmailProvider');
