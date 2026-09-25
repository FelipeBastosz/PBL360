import { Injectable, Logger } from '@nestjs/common';
import { CODE_EXPIRATION_MINUTES } from '../../application/services/one-time-code.service';
import type { CodeRecipient, CodeSender } from '../../domain/services/code-sender';
import { buildCodeEmail, type CodeEmailTemplate } from './code-email';
import { MailTransport } from './mail-transport';

abstract class NodemailerCodeSender implements CodeSender {
  private readonly logger = new Logger(this.constructor.name);

  protected constructor(
    private readonly transport: MailTransport,
    private readonly template: CodeEmailTemplate,
  ) {}

  async sendCode(recipient: CodeRecipient): Promise<void> {
    await this.transport.send(buildCodeEmail(this.template, recipient, CODE_EXPIRATION_MINUTES));
    this.logger.log(`Code e-mail sent to user ${recipient.userId}.`);
  }
}

@Injectable()
export class NodemailerEmailVerificationSender extends NodemailerCodeSender {
  constructor(transport: MailTransport) {
    super(transport, { subject: 'Código de Verificação - PBL360', purpose: 'verificação' });
  }
}

@Injectable()
export class NodemailerPasswordResetSender extends NodemailerCodeSender {
  constructor(transport: MailTransport) {
    super(transport, {
      subject: 'Recuperação de senha - PBL360',
      purpose: 'recuperação de senha',
      footer: 'Se você não pediu essa recuperação, ignore este e-mail.',
    });
  }
}
