import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/users/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';
import { VerificationCodeIssuer } from '../services/verification-code-issuer';

export interface ResendVerificationCodeInput {
  email: string;
}

export const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class ResendVerificationCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: EmailVerificationCodeRepository,
    private readonly issuer: VerificationCodeIssuer,
  ) {}

  async execute(input: ResendVerificationCodeInput): Promise<void> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (!user || !user.isPendingVerification() || (await this.wasAskedTooRecently(user))) {
      return;
    }

    await this.issuer.issueFor(user);
  }

  private async wasAskedTooRecently(user: User): Promise<boolean> {
    const pendingCode = await this.codes.findPendingByUserId(user.id);

    if (!pendingCode) {
      return false;
    }

    const elapsed = Date.now() - pendingCode.createdAt.getTime();

    return elapsed < RESEND_COOLDOWN_SECONDS * 1000;
  }
}
