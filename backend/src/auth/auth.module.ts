import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from '@/users/users.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { ACCESS_TOKEN_ISSUER } from './domain/services/access-token-issuer';
import { EMAIL_VERIFICATION_SENDER } from './domain/services/email-verification-sender';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { PendingEmailVerificationSender } from './infrastructure/email/pending-email-verification-sender';
import { AuthController } from './infrastructure/http/auth.controller';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtAccessTokenIssuer } from './infrastructure/security/jwt-access-token-issuer';

type TokenTtl = NonNullable<JwtSignOptions['expiresIn']>;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
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
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    { provide: EMAIL_VERIFICATION_SENDER, useClass: PendingEmailVerificationSender },
  ],
})
export class AuthModule {}
