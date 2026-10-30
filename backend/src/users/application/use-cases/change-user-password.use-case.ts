import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, UnauthorizedError } from '@/shared/errors/application.error';
import { PASSWORD_HASHER, type PasswordHasher } from '@/auth/domain/services/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../../domain/repositories/user.repository';

export interface ChangeUserPasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

const INVALID_CURRENT_PASSWORD = 'A senha atual informada está incorreta.';

@Injectable()
export class ChangeUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: ChangeUserPasswordInput): Promise<void> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    const matches = await this.hasher.matches(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError(INVALID_CURRENT_PASSWORD);
    }

    user.changePassword(await this.hasher.hash(input.newPassword));
    await this.users.save(user);
  }
}
