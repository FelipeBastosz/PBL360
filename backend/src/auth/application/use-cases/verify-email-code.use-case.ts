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
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';

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
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: EmailVerificationCodeRepository,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(input: VerifyEmailCodeInput): Promise<AuthenticatedSession> {
    const user = await this.findPendingAccount(input);
    const pendingCode = await this.codes.findPendingByUserId(user.id);

    if (!pendingCode || !pendingCode.isValid(input.code)) {
      throw new InvalidRequestError(INVALID_CODE);
    }

    await this.codes.markAsUsed(pendingCode.id);

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
