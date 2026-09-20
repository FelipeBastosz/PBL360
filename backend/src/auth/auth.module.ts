import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from '@/users/users.module';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { ACCESS_TOKEN_ISSUER } from './domain/services/access-token-issuer';
import { EMAIL_VERIFICATION_SENDER } from './domain/services/email-verification-sender';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { NodemailerEmailVerificationSender } from './infrastructure/email/nodemailer-email-verification-sender';
import { AuthController } from './infrastructure/http/auth.controller';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtAccessTokenIssuer } from './infrastructure/security/jwt-access-token-issuer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationCode } from './domain/entities/email-verification-code.entity';
import { EMAIL_VERIFICATION_CODE_REPOSITORY } from './domain/repositories/email-verification-code.repository';
import { TypeOrmEmailVerificationCodeRepository } from './infrastructure/database/typeorm-email-verification-code.repository';
import { VerifyEmailCodeUseCase } from './application/use-cases/verify-email-code.use-case';

type TokenTtl = NonNullable<JwtSignOptions['expiresIn']>;

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerificationCode]),
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('auth.jwtSecret') ??
          config.get<string>('JWT_SECRET') ??
          'chave_secreta_provisoria_para_testes',
        signOptions: { expiresIn: config.get<TokenTtl>('auth.jwtExpiresIn') ?? '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUseCase,
    VerifyEmailCodeUseCase,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    { provide: EMAIL_VERIFICATION_SENDER, useClass: NodemailerEmailVerificationSender },
    {
      provide: EMAIL_VERIFICATION_CODE_REPOSITORY,
      useClass: TypeOrmEmailVerificationCodeRepository,
    },
  ],
})
export class AuthModule {}
