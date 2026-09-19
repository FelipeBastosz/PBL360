import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailVerificationRecipient,
  EmailVerificationSender,
} from '../../domain/services/email-verification-sender';

@Injectable()
export class PendingEmailVerificationSender implements EmailVerificationSender {
  private readonly logger = new Logger(PendingEmailVerificationSender.name);

  async sendVerificationCode(recipient: EmailVerificationRecipient): Promise<void> {
    this.logger.warn(
      `No e-mail sender wired yet: user ${recipient.userId} was not sent a verification code.`,
    );

    return Promise.resolve();
  }
}
