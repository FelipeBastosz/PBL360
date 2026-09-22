import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/users/domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import {
  PASSWORD_RESET_CODE_REPOSITORY,
  type PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';
import { PasswordResetCodeIssuer } from '../services/password-reset-code-issuer';

export interface RequestPasswordResetInput {
  email: string;
}

export const REQUEST_COOLDOWN_SECONDS = 60;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_CODE_REPOSITORY)
    private readonly codes: PasswordResetCodeRepository,
    private readonly issuer: PasswordResetCodeIssuer,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (!user || (await this.wasAskedTooRecently(user))) {
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

    return elapsed < REQUEST_COOLDOWN_SECONDS * 1000;
  }
}
