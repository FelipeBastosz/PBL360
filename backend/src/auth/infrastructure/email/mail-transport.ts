import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const SENDER_NAME = 'PBL360';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

@Injectable()
export class MailTransport {
  private readonly transporter: nodemailer.Transporter;
  private readonly user: string;
  private readonly gmail: GmailCredentials;

  constructor(config: ConfigService) {
    this.user = config.get<string>('mail.smtpUser') ?? '';
    this.gmail = {
      clientId: config.get<string>('mail.gmailClientId') ?? '',
      clientSecret: config.get<string>('mail.gmailClientSecret') ?? '',
      refreshToken: config.get<string>('mail.gmailRefreshToken') ?? '',
    };
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.user, pass: config.get<string>('mail.smtpPass') ?? '' },
    });
  }

  async send(message: MailMessage): Promise<void> {
    const mail = { from: `${SENDER_NAME} <${this.user}>`, ...message };

    if (this.gmail.refreshToken) {
      return this.sendWithGmailApi(await new MailComposer(mail).compile().build());
    }

    await this.transporter.sendMail(mail);
  }

  // Railway blocks outbound SMTP below the Pro plan, so production sends through the Gmail API over HTTPS.
  private async sendWithGmailApi(raw: Buffer): Promise<void> {
    const response = await fetch(GMAIL_SEND_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await this.gmailAccessToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ raw: raw.toString('base64url') }),
    });

    if (!response.ok) {
      throw new Error(`Gmail rejected the e-mail (${response.status}): ${await response.text()}`);
    }
  }

  private async gmailAccessToken(): Promise<string> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.gmail.clientId,
        client_secret: this.gmail.clientSecret,
        refresh_token: this.gmail.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Google refused the Gmail token (${response.status}): ${await response.text()}`,
      );
    }

    return ((await response.json()) as { access_token: string }).access_token;
  }
}
