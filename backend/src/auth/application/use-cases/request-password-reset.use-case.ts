import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { PasswordResetCodes } from '../services/password-reset-codes';

export interface RequestPasswordResetInput {
  email: string;
}

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly resetCodes: PasswordResetCodes,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (user) {
      await this.resetCodes.issueFor(user);
    }
  }
}
