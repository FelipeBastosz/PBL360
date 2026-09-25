import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IdentityThrottlerGuard } from '@/shared/throttling/identity-throttler.guard';
import { STRICT_AUTH_LIMIT } from '@/shared/throttling/throttlers';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { PasswordResetTokenResponseDto } from '../../application/dtos/password-reset-token-response.dto';
import { RequestPasswordResetDto } from '../../application/dtos/request-password-reset.dto';
import { ResendVerificationCodeDto } from '../../application/dtos/resend-verification-code.dto';
import { ResetPasswordDto } from '../../application/dtos/reset-password.dto';
import { ValidatePasswordResetCodeDto } from '../../application/dtos/validate-password-reset-code.dto';
import { VerifyEmailCodeDto } from '../../application/dtos/verify-email-code.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { RegisterResponseDto } from '../../application/dtos/register-response.dto';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { SessionResponseDto } from '../../application/dtos/session-response.dto';
import { VerificationResponseDto } from '../../application/dtos/verification-response.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResendVerificationCodeUseCase } from '../../application/use-cases/resend-verification-code.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ValidatePasswordResetCodeUseCase } from '../../application/use-cases/validate-password-reset-code.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import {
  toPasswordResetTokenResponse,
  toRegisterResponse,
  toRegisterUserInput,
  toSessionResponse,
  toValidatePasswordResetCodeInput,
  toVerifyEmailCodeInput,
} from './auth.mapper';
import { Public } from '@/shared/decorators/public.decorator';
import {
  LoginAuthSwaggerDocs,
  RegisterAuthSwaggerDocs,
  RequestPasswordResetAuthSwaggerDocs,
  ResendCodeAuthSwaggerDocs,
  ResetPasswordAuthSwaggerDocs,
  ValidatePasswordResetCodeAuthSwaggerDocs,
  VerifyCodeAuthSwaggerDocs,
} from './auth.swagger';
import { PendingVerificationFilter } from './pending-verification.filter';

const VERIFICATION_SENT =
  'Cadastro realizado. Enviamos um código de verificação para o seu e-mail institucional.';

const ACCOUNT_ACTIVATED = 'Conta ativada com sucesso.';

const CODE_RESENT =
  'Se houver uma conta pendente de verificação com este e-mail, enviamos um novo código.';

const PASSWORD_RESET_REQUESTED =
  'Se houver uma conta com este e-mail, enviamos um código de recuperação de senha.';

const PASSWORD_RESET = 'Senha redefinida com sucesso.';

@ApiTags('Autenticação')
@Controller('autenticacao')
@Public()
@UseGuards(IdentityThrottlerGuard)
@UseFilters(PendingVerificationFilter)
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
    private readonly verifyEmailCode: VerifyEmailCodeUseCase,
    private readonly resendVerificationCode: ResendVerificationCodeUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly validatePasswordResetCode: ValidatePasswordResetCodeUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Post('registro')
  @RegisterAuthSwaggerDocs
  async register(@Body() dto: RegisterUserDto): Promise<RegisterResponseDto> {
    const user = await this.registerUser.execute(toRegisterUserInput(dto));

    return toRegisterResponse(user, VERIFICATION_SENT);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LoginAuthSwaggerDocs
  async signIn(@Body() dto: LoginDto): Promise<SessionResponseDto> {
    return toSessionResponse(await this.login.execute({ email: dto.email, password: dto.senha }));
  }

  @Post('verificar-codigo')
  @HttpCode(HttpStatus.OK)
  @VerifyCodeAuthSwaggerDocs
  async verifyCode(@Body() dto: VerifyEmailCodeDto): Promise<VerificationResponseDto> {
    const session = await this.verifyEmailCode.execute(toVerifyEmailCodeInput(dto));

    return { mensagem: ACCOUNT_ACTIVATED, ...toSessionResponse(session) };
  }

  @Post('reenviar-codigo')
  @Throttle(STRICT_AUTH_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ResendCodeAuthSwaggerDocs
  async resendCode(@Body() dto: ResendVerificationCodeDto): Promise<MessageResponseDto> {
    await this.resendVerificationCode.execute({ email: dto.email });

    return { mensagem: CODE_RESENT };
  }

  @Throttle(STRICT_AUTH_LIMIT)
  @Post('recuperacao-senha')
  @HttpCode(HttpStatus.OK)
  @RequestPasswordResetAuthSwaggerDocs
  async requestPasswordResetCode(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<MessageResponseDto> {
    await this.requestPasswordReset.execute({ email: dto.email });

    return { mensagem: PASSWORD_RESET_REQUESTED };
  }

  @Throttle(STRICT_AUTH_LIMIT)
  @Post('recuperacao-senha/validar-codigo')
  @HttpCode(HttpStatus.OK)
  @ValidatePasswordResetCodeAuthSwaggerDocs
  async validateResetCode(
    @Body() dto: ValidatePasswordResetCodeDto,
  ): Promise<PasswordResetTokenResponseDto> {
    const input = toValidatePasswordResetCodeInput(dto);

    return toPasswordResetTokenResponse(await this.validatePasswordResetCode.execute(input));
  }

  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @ResetPasswordAuthSwaggerDocs
  async redefinePassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    await this.resetPassword.execute({ resetToken: dto.token, newPassword: dto.novaSenha });

    return { mensagem: PASSWORD_RESET };
  }
}
