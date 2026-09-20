import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { User } from '@/users/domain/entities/user.entity';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';
import {
  EMAIL_VERIFICATION_SENDER,
  type EmailVerificationSender,
} from '../../domain/services/email-verification-sender';

export const EXPIRATION_MINUTES = 10;

@Injectable()
export class VerificationCodeIssuer {
  private readonly logger = new Logger(VerificationCodeIssuer.name);

  constructor(
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: EmailVerificationCodeRepository,
    @Inject(EMAIL_VERIFICATION_SENDER) private readonly verification: EmailVerificationSender,
  ) {}

  async issueFor(user: User): Promise<void> {
    const code = randomInt(100000, 999999).toString();

    await this.codes.invalidatePendingFor(user.id);
    await this.codes.save(
      EmailVerificationCode.issue({
        userId: user.id,
        email: user.email,
        code,
        expiresInMinutes: EXPIRATION_MINUTES,
      }),
    );

    await this.notify(user, code);
  }

  private async notify(user: User, code: string): Promise<void> {
    try {
      await this.verification.sendVerificationCode({
        userId: user.id,
        name: user.name,
        email: user.email,
        code,
      });
    } catch (error) {
      this.logger.error(`Could not send verification code to ${user.email}.`, error);
    }
  }
}
