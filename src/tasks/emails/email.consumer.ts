import { Process, Processor } from '@nestjs/bull';
import {
  InternalServerErrorException,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import {
  SendEmailParams,
  EmailBodyParams,
  EmailAttachment,
} from './interfaces/email.interface';
import * as sg from '@sendgrid/mail';
import { EmailTemplate } from './enums/email.enum';

@Processor('email')
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly configService: ConfigService) {}

  private readonly key: string = `${this.configService.get<string>('SENDGRID_KEY')}`;
  private readonly from: string = `${this.configService.get<string>('SENDGRID_FROM')}`;
  private readonly name: string = `${this.configService.get<string>('SENDGRID_NAME')}`;

  private readonly templateVerifyEmail: string = `${this.configService.get<string>('SENDGRID_VERIFY_EMAIL')}`;
  private readonly templateWelcome: string = `${this.configService.get<string>('SENDGRID_WELCOME')}`;
  private readonly templateResetPassword: string = `${this.configService.get<string>('SENDGRID_RESET_PASSWORD')}`;

  @Process('send')
  async sendEmail(job: Job): Promise<void> {
    const { data, attachments } = job.data as SendEmailParams;

    try {
      await this.sendEmailWithSendGrid(data, attachments);
      job.moveToCompleted('completed', true);
    } catch (error) {
      const e = error as Error;

      this.logger.error(error);
      job.moveToFailed({ message: e.message }, true);

      throw new InternalServerErrorException(
        `Failed to send email with sendgrid`,
      );
    }
  }

  private async sendEmailWithSendGrid(
    data: EmailBodyParams,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    sg.setApiKey(this.key);

    const from = { name: this.name, email: this.from };
    const { to, template, dynamicTemplateData } = data;

    const templateId = this.setTemplate(template);

    try {
      await sg.send({ from, to, templateId, dynamicTemplateData, attachments });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        `Failed to send email with sendgrid`,
      );
    }
  }

  private setTemplate(template: EmailTemplate): string {
    switch (template) {
      case EmailTemplate.VERIFY_EMAIL:
        return this.templateVerifyEmail;

      case EmailTemplate.WELCOME:
        return this.templateWelcome;

      case EmailTemplate.RESET_PASSWORD:
        return this.templateResetPassword;

      default:
        throw new NotImplementedException(
          `Email template: ${template} is not yet implemented.`,
        );
    }
  }
}
