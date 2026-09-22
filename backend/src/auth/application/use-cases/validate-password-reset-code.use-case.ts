import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import {
  PASSWORD_RESET_CODE_REPOSITORY,
  type PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';
import type { PasswordResetToken } from '../../domain/services/password-reset-token-issuer';
import {
  PASSWORD_RESET_TOKEN_ISSUER,
  type PasswordResetTokenIssuer,
} from '../../domain/services/password-reset-token-issuer';

export interface ValidatePasswordResetCodeInput {
  email: string;
  code: string;
}

const INVALID_CODE = 'Código de recuperação inválido ou expirado.';

@Injectable()
export class ValidatePasswordResetCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_CODE_REPOSITORY)
    private readonly codes: PasswordResetCodeRepository,
    @Inject(PASSWORD_RESET_TOKEN_ISSUER) private readonly tokens: PasswordResetTokenIssuer,
  ) {}

  async execute(input: ValidatePasswordResetCodeInput): Promise<PasswordResetToken> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const pendingCode = user ? await this.codes.findPendingByUserId(user.id) : null;

    if (!pendingCode) {
      throw new BadRequestException(INVALID_CODE);
    }

    if (!pendingCode.isValid(input.code)) {
      await this.codes.registerFailedAttempt(pendingCode.id);
      throw new BadRequestException(INVALID_CODE);
    }

    await this.codes.markAsUsed(pendingCode.id);

    return this.tokens.issueFor(pendingCode.userId);
  }
}
