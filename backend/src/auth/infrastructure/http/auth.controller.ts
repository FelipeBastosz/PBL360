import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { PendingVerificationResponseDto } from '../../application/dtos/pending-verification-response.dto';
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
import { AuthGuard } from '@/shared/guards/auth.guard';
import { Public } from '@/shared/decorators/public.decorator';

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
@UseGuards(AuthGuard)
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

  @Public()
  @Post('registro')
  @ApiOperation({
    summary: 'Cadastra um usuário',
    description:
      'Cria a conta inativa e envia um código de verificação para o e-mail institucional. ' +
      'Nenhum token é emitido aqui: use o `usuarioId` devolvido em /autenticacao/verificar-codigo ' +
      'para ativar a conta. PROFESSOR pode omitir matrícula e foto; ALUNO precisa das duas.',
  })
  @ApiCreatedResponse({
    description: 'Conta criada, pendente de verificação.',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.', type: ErrorResponseDto })
  async register(@Body() dto: RegisterUserDto): Promise<RegisterResponseDto> {
    const user = await this.registerUser.execute(toRegisterUserInput(dto));

    return toRegisterResponse(user, VERIFICATION_SENT);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário', description: 'Devolve o token JWT da sessão.' })
  @ApiOkResponse({ description: 'Credenciais válidas.', type: SessionResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.', type: ErrorResponseDto })
  @ApiForbiddenResponse({
    description:
      'Conta pendente de verificação. O corpo traz o `usuarioId` e o `email` necessários ' +
      'em /autenticacao/verificar-codigo.',
    type: PendingVerificationResponseDto,
  })
  async signIn(@Body() dto: LoginDto): Promise<SessionResponseDto> {
    return toSessionResponse(await this.login.execute({ email: dto.email, password: dto.senha }));
  }

  @Public()
  @Post('verificar-codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativa a conta com o código recebido por e-mail',
    description: 'Valida o código, marca a conta como ativa e devolve o token JWT da sessão.',
  })
  @ApiOkResponse({ description: 'Conta ativada.', type: VerificationResponseDto })
  @ApiBadRequestResponse({
    description: 'Código inválido, expirado ou conta já verificada.',
    type: ErrorResponseDto,
  })
  async verifyCode(@Body() dto: VerifyEmailCodeDto): Promise<VerificationResponseDto> {
    const session = await this.verifyEmailCode.execute(toVerifyEmailCodeInput(dto));

    return { mensagem: ACCOUNT_ACTIVATED, ...toSessionResponse(session) };
  }

  @Public()
  @Post('reenviar-codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenvia o código de verificação',
    description:
      'Invalida os códigos pendentes e envia um novo. A resposta é sempre a mesma, exista ' +
      'ou não uma conta pendente com o e-mail informado, para não revelar quem está cadastrado. ' +
      'Pedidos repetidos dentro de 60 segundos não disparam um novo e-mail.',
  })
  @ApiOkResponse({ description: 'Pedido recebido.', type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  async resendCode(@Body() dto: ResendVerificationCodeDto): Promise<MessageResponseDto> {
    await this.resendVerificationCode.execute({ email: dto.email });

    return { mensagem: CODE_RESENT };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'password-reset': { limit: 5, ttl: 900_000 } })
  @Post('recuperacao-senha')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita a recuperação de senha',
    description:
      'Gera e envia um código de recuperação. Resposta sempre igual, exista ou não a conta. ' +
      'Cooldown de 60s por conta; limite de 5 pedidos por IP a cada 15 min.',
  })
  @ApiOkResponse({ description: 'Pedido recebido.', type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  async requestPasswordResetCode(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<MessageResponseDto> {
    await this.requestPasswordReset.execute({ email: dto.email });

    return { mensagem: PASSWORD_RESET_REQUESTED };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'password-reset': { limit: 5, ttl: 900_000 } })
  @Post('recuperacao-senha/validar-codigo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida o código de recuperação de senha',
    description:
      'Devolve um token de curta duração, usado só em /autenticacao/redefinir-senha. ' +
      'Limitado a 5 tentativas por IP a cada 15 minutos, além do limite de 5 tentativas por código.',
  })
  @ApiOkResponse({ description: 'Código válido.', type: PasswordResetTokenResponseDto })
  @ApiBadRequestResponse({ description: 'Código inválido ou expirado.', type: ErrorResponseDto })
  async validateResetCode(
    @Body() dto: ValidatePasswordResetCodeDto,
  ): Promise<PasswordResetTokenResponseDto> {
    const input = toValidatePasswordResetCodeInput(dto);

    return toPasswordResetTokenResponse(await this.validatePasswordResetCode.execute(input));
  }

  @Public()
  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefine a senha',
    description:
      'Aplica a nova senha usando o token devolvido por /autenticacao/recuperacao-senha/validar-codigo.',
  })
  @ApiOkResponse({ description: 'Senha redefinida.', type: MessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Token inválido, expirado ou payload inválido.',
    type: ErrorResponseDto,
  })
  async redefinePassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    await this.resetPassword.execute({ resetToken: dto.token, newPassword: dto.novaSenha });

    return { mensagem: PASSWORD_RESET };
  }
}
