import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/application.error';
import type { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, type UserRepository } from '../../domain/repositories/user.repository';

export interface GetUserProfileInput {
  userId: string;
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(input: GetUserProfileInput): Promise<User> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return user;
  }
}
