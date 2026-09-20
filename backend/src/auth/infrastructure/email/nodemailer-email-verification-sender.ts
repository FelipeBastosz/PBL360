import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type {
  EmailVerificationRecipient,
  EmailVerificationSender,
} from '../../domain/services/email-verification-sender';

@Injectable()
export class NodemailerEmailVerificationSender implements EmailVerificationSender {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NodemailerEmailVerificationSender.name);
  private readonly userEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.userEmail = this.configService.get<string>('SMTP_USER') ?? 'pbl360.ecomp@gmail.com';
    const pass = this.configService.get<string>('SMTP_PASS') ?? 'mnvalnildpsaikkk';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.userEmail, pass },
    });
  }

  async sendVerificationCode(recipient: EmailVerificationRecipient): Promise<void> {
    const from = `PBL360 <${this.userEmail}>`;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: recipient.email,
        subject: 'Código de Verificação - PBL360',
        text: `Olá ${recipient.name}, o seu código de verificação é: ${recipient.code}`,
        html: `<p>Olá ${recipient.name},</p><p>O seu código de verificação é: <strong>${recipient.code}</strong></p><p>Este código expira em 15 minutos.</p>`,
      });

      this.logger.log(`E-mail enviado para ${recipient.email}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${recipient.email}`, error);
      throw error;
    }
  }
}
