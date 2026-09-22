import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import type { User } from '@/users/domain/entities/user.entity';
import { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import {
  PASSWORD_RESET_CODE_REPOSITORY,
  type PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';
import {
  PASSWORD_RESET_SENDER,
  type PasswordResetSender,
} from '../../domain/services/password-reset-sender';

export const EXPIRATION_MINUTES = 10;

@Injectable()
export class PasswordResetCodeIssuer {
  private readonly logger = new Logger(PasswordResetCodeIssuer.name);

  constructor(
    @Inject(PASSWORD_RESET_CODE_REPOSITORY)
    private readonly codes: PasswordResetCodeRepository,
    @Inject(PASSWORD_RESET_SENDER) private readonly sender: PasswordResetSender,
  ) {}

  async issueFor(user: User): Promise<void> {
    const code = randomInt(100000, 999999).toString();

    await this.codes.invalidatePendingFor(user.id);
    await this.codes.save(
      PasswordResetCode.issue({
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
      await this.sender.sendResetCode({
        userId: user.id,
        name: user.name,
        email: user.email,
        code,
      });
    } catch (error) {
      this.logger.error(`Could not send password reset code to ${user.email}.`, error);
    }
  }
}
