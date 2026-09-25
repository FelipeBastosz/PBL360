import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import {
  PASSWORD_RESET_TOKEN_ISSUER,
  type PasswordResetTokenIssuer,
} from '../../domain/services/password-reset-token-issuer';

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

const INVALID_TOKEN = 'Token de redefinição inválido ou expirado.';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_ISSUER) private readonly tokens: PasswordResetTokenIssuer,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const subject = await this.tokens.verify(input.resetToken);
    const user = subject ? await this.users.findById(subject.userId) : null;

    if (!subject || !user || user.tokenVersion !== subject.tokenVersion) {
      throw new InvalidRequestError(INVALID_TOKEN);
    }

    user.changePassword(await this.hasher.hash(input.newPassword));
    await this.users.save(user);
  }
}
