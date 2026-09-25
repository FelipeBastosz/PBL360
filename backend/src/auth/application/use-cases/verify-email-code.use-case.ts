import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import type { User } from '@/users/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import type { AuthenticatedSession } from '../authenticated-session';
import {
  ACCESS_TOKEN_ISSUER,
  type AccessTokenIssuer,
} from '../../domain/services/access-token-issuer';
import { EmailVerificationCodes } from '../services/email-verification-codes';

export interface VerifyEmailCodeInput {
  userId: string;
  email: string;
  code: string;
}

const INVALID_CODE = 'Código de verificação inválido ou expirado.';

@Injectable()
export class VerifyEmailCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly verificationCodes: EmailVerificationCodes,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(input: VerifyEmailCodeInput): Promise<AuthenticatedSession> {
    const user = await this.findPendingAccount(input);

    if (!(await this.verificationCodes.redeem(user.id, input.code))) {
      throw new InvalidRequestError(INVALID_CODE);
    }

    user.activate();
    const activated = await this.users.save(user);

    return { user: activated, accessToken: await this.tokens.issueFor(activated) };
  }

  private async findPendingAccount(input: VerifyEmailCodeInput): Promise<User> {
    const user = await this.users.findById(input.userId);

    if (!user || user.email !== input.email.trim().toLowerCase()) {
      throw new InvalidRequestError(INVALID_CODE);
    }

    if (!user.isPendingVerification()) {
      throw new InvalidRequestError('Esta conta já foi verificada.');
    }

    return user;
  }
}
