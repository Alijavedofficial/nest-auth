import { EmailTemplate } from '../enums/email.enum';

export interface SendEmailParams {
  data: EmailBodyParams;
  attachments?: EmailAttachment[];
}

export interface EmailBodyParams {
  template: EmailTemplate;
  to: string[];
  dynamicTemplateData?: { [key: string]: string };
}

export interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
}
