import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import type { AuthenticatedSession } from '../authenticated-session';
import {
  ACCESS_TOKEN_ISSUER,
  type AccessTokenIssuer,
} from '../../domain/services/access-token-issuer';
import {
  EMAIL_VERIFICATION_SENDER,
  type EmailVerificationSender,
} from '../../domain/services/email-verification-sender';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';

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
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
    @Inject(EMAIL_VERIFICATION_SENDER) private readonly verification: EmailVerificationSender,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Já existe uma conta cadastrada com este e-mail.');
    }

    const user = await this.users.save(
      User.create({ ...input, email, passwordHash: await this.passwords.hash(input.password) }),
    );

    await this.requestEmailVerification(user);

    return { user, accessToken: await this.tokens.issueFor(user) };
  }

  private async requestEmailVerification(user: User): Promise<void> {
    try {
      await this.verification.sendVerificationCode({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      this.logger.error(`Could not send the verification code to ${user.email}.`, error);
    }
  }
}
