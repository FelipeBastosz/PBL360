import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import { User } from '@/users/domain/entities/user.entity';
import { UserPhoto } from '@/users/domain/entities/user-photo.entity';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import { USER_REPOSITORY, type UserRepository } from '@/users/domain/repositories/user.repository';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { EmailVerificationCodes } from '../services/email-verification-codes';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  type: UserType;
  registrationNumber?: string | null;
  photo?: Buffer | null;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly verificationCodes: EmailVerificationCodes,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail.');
    }

    const photo = input.photo ? UserPhoto.fromBytes(input.photo) : null;
    const user = await this.users.save(
      User.create({
        ...input,
        email,
        photo,
        passwordHash: await this.passwords.hash(input.password),
      }),
    );

    await this.verificationCodes.issueFor(user);

    return user;
  }
}
