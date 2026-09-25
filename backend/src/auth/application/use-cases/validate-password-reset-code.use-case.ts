import { Inject, Injectable } from '@nestjs/common';
import { InvalidRequestError } from '@/shared/errors/application.error';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import {
  PASSWORD_RESET_TOKEN_ISSUER,
  type PasswordResetToken,
  type PasswordResetTokenIssuer,
} from '../../domain/services/password-reset-token-issuer';
import { PasswordResetCodes } from '../services/password-reset-codes';

export interface ValidatePasswordResetCodeInput {
  email: string;
  code: string;
}

const INVALID_CODE = 'Código de recuperação inválido ou expirado.';

@Injectable()
export class ValidatePasswordResetCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly resetCodes: PasswordResetCodes,
    @Inject(PASSWORD_RESET_TOKEN_ISSUER) private readonly tokens: PasswordResetTokenIssuer,
  ) {}

  async execute(input: ValidatePasswordResetCodeInput): Promise<PasswordResetToken> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const redeemed = user ? await this.resetCodes.redeem(user.id, input.code) : null;

    if (!user || !redeemed) {
      throw new InvalidRequestError(INVALID_CODE);
    }

    return this.tokens.issueFor({ userId: user.id, tokenVersion: user.tokenVersion });
  }
}
