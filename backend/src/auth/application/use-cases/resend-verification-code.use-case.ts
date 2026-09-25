import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { EmailVerificationCodes } from '../services/email-verification-codes';

export interface ResendVerificationCodeInput {
  email: string;
}

@Injectable()
export class ResendVerificationCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly verificationCodes: EmailVerificationCodes,
  ) {}

  async execute(input: ResendVerificationCodeInput): Promise<void> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (user?.isPendingVerification()) {
      await this.verificationCodes.issueFor(user);
    }
  }
}
