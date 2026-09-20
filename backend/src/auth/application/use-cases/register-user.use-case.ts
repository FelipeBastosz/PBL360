import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
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
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  type: UserType;
  registrationNumber?: string | null;
  photoUrl?: string | null;
}

const EXPIRATION_MINUTES = 10;

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
    @Inject(EMAIL_VERIFICATION_SENDER) private readonly verification: EmailVerificationSender,
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: EmailVerificationCodeRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Já existe uma conta cadastrada com este e-mail.');
    }

    const user = await this.users.save(
      User.create({ ...input, email, passwordHash: await this.passwords.hash(input.password) }),
    );

    await this.generateAndSendVerificationCode(user);

    return { user, accessToken: await this.tokens.issueFor(user) };
  }

  private createVerificationEntity(email: string, code: string): EmailVerificationCode {
    const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);
    return Object.assign(new EmailVerificationCode(), {
      id: randomUUID(),
      email,
      code,
      expiresAt,
      createdAt: new Date(),
      usedAt: null,
    });
  }

  private async generateAndSendVerificationCode(user: User): Promise<void> {
    const code = randomInt(100000, 999999).toString();
    await this.codes.save(this.createVerificationEntity(user.email, code));

    try {
      await this.verification.sendVerificationCode({
        userId: user.id,
        name: user.name,
        email: user.email,
        code,
      });
    } catch (error) {
      this.logger.error(`Could not send verification code to ${user.email}.`, error);
    }
  }
}
