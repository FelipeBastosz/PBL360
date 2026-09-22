import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type {
  PasswordResetRecipient,
  PasswordResetSender,
} from '../../domain/services/password-reset-sender';

@Injectable()
export class NodemailerPasswordResetSender implements PasswordResetSender {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerPasswordResetSender.name);
  private readonly userEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.userEmail = this.configService.get<string>('SMTP_USER') ?? '';
    const pass = this.configService.get<string>('SMTP_PASS') ?? '';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.userEmail, pass },
    });
  }

  async sendResetCode(recipient: PasswordResetRecipient): Promise<void> {
    const from = `PBL360 <${this.userEmail}>`;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: recipient.email,
        subject: 'Recuperação de senha - PBL360',
        text: `Olá ${recipient.name}, o seu código de recuperação de senha é: ${recipient.code}`,
        html: `<p>Olá ${recipient.name},</p><p>O seu código de recuperação de senha é: <strong>${recipient.code}</strong></p><p>Este código expira em 10 minutos. Se você não pediu essa recuperação, ignore este e-mail.</p>`,
      });

      this.logger.log(`E-mail enviado para ${recipient.email}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${recipient.email}`, error);
      throw error;
    }
  }
}
