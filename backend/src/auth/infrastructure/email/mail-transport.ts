import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const SENDER_NAME = 'PBL360';
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class MailTransport {
  private readonly transporter: nodemailer.Transporter;
  private readonly user: string;
  private readonly brevoApiKey: string;

  constructor(config: ConfigService) {
    this.user = config.get<string>('mail.smtpUser') ?? '';
    this.brevoApiKey = config.get<string>('mail.brevoApiKey') ?? '';
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.user, pass: config.get<string>('mail.smtpPass') ?? '' },
    });
  }

  async send(message: MailMessage): Promise<void> {
    if (this.brevoApiKey) {
      return this.sendWithBrevo(message);
    }

    await this.transporter.sendMail({ from: `${SENDER_NAME} <${this.user}>`, ...message });
  }

  // Railway blocks outbound SMTP below the Pro plan, so production sends over HTTPS.
  private async sendWithBrevo({ to, subject, text, html }: MailMessage): Promise<void> {
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': this.brevoApiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: this.user },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Brevo rejected the e-mail (${response.status}): ${await response.text()}`);
    }
  }
}
