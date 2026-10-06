import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@/users/users.module';
import { PerformanceTablesModule } from '@/performance-tables/performance-tables.module';
import { EmailVerificationCodes } from './application/services/email-verification-codes';
import { PasswordResetCodes } from './application/services/password-reset-codes';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResendVerificationCodeUseCase } from './application/use-cases/resend-verification-code.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { ValidatePasswordResetCodeUseCase } from './application/use-cases/validate-password-reset-code.use-case';
import { VerifyEmailCodeUseCase } from './application/use-cases/verify-email-code.use-case';
import { EmailVerificationCode } from './domain/entities/email-verification-code.entity';
import { PasswordResetCode } from './domain/entities/password-reset-code.entity';
import { EMAIL_VERIFICATION_CODE_REPOSITORY } from './domain/repositories/email-verification-code.repository';
import { PASSWORD_RESET_CODE_REPOSITORY } from './domain/repositories/password-reset-code.repository';
import { ACCESS_TOKEN_ISSUER } from './domain/services/access-token-issuer';
import { EMAIL_VERIFICATION_SENDER } from './domain/services/email-verification-sender';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { PASSWORD_RESET_SENDER } from './domain/services/password-reset-sender';
import { PASSWORD_RESET_TOKEN_ISSUER } from './domain/services/password-reset-token-issuer';
import { PgEmailVerificationCodeRepository } from './infrastructure/database/pg-email-verification-code.repository';
import { PgPasswordResetCodeRepository } from './infrastructure/database/pg-password-reset-code.repository';
import { MailTransport } from './infrastructure/email/mail-transport';
import {
  NodemailerEmailVerificationSender,
  NodemailerPasswordResetSender,
} from './infrastructure/email/nodemailer-code-sender';
import { AuthController } from './infrastructure/http/auth.controller';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtAccessTokenIssuer } from './infrastructure/security/jwt-access-token-issuer';
import { JwtPasswordResetTokenIssuer } from './infrastructure/security/jwt-password-reset-token-issuer';

type TokenTtl = NonNullable<JwtSignOptions['expiresIn']>;

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerificationCode, PasswordResetCode]),
    UsersModule,
    PerformanceTablesModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<TokenTtl>('auth.jwtExpiresIn') ?? '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    VerifyEmailCodeUseCase,
    ResendVerificationCodeUseCase,
    RequestPasswordResetUseCase,
    ValidatePasswordResetCodeUseCase,
    ResetPasswordUseCase,
    EmailVerificationCodes,
    PasswordResetCodes,
    MailTransport,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    { provide: PASSWORD_RESET_TOKEN_ISSUER, useClass: JwtPasswordResetTokenIssuer },
    { provide: EMAIL_VERIFICATION_SENDER, useClass: NodemailerEmailVerificationSender },
    { provide: PASSWORD_RESET_SENDER, useClass: NodemailerPasswordResetSender },
    { provide: EMAIL_VERIFICATION_CODE_REPOSITORY, useClass: PgEmailVerificationCodeRepository },
    { provide: PASSWORD_RESET_CODE_REPOSITORY, useClass: PgPasswordResetCodeRepository },
  ],
})
export class AuthModule {}
