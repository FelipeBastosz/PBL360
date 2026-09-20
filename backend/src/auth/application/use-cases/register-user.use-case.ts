import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { VerificationCodeIssuer } from '../services/verification-code-issuer';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  type: UserType;
  registrationNumber?: string | null;
  photoUrl?: string | null;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly issuer: VerificationCodeIssuer,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Já existe uma conta cadastrada com este e-mail.');
    }

    const user = await this.users.save(
      User.create({ ...input, email, passwordHash: await this.passwords.hash(input.password) }),
    );

    await this.issuer.issueFor(user);

    return user;
  }
}
