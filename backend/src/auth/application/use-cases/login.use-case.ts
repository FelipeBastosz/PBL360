import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '@/shared/errors/application.error';
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
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { AccountPendingVerificationError } from '../errors/account-pending-verification.error';

export interface LoginInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<AuthenticatedSession> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (!user || !(await this.passwords.matches(input.password, user.passwordHash))) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    this.assertIsActive(user);

    return { user, accessToken: await this.tokens.issueFor(user) };
  }

  private assertIsActive(user: User): void {
    if (user.isPendingVerification()) {
      throw new AccountPendingVerificationError(user.id, user.email);
    }
  }
}
