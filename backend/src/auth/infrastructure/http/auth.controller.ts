import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { PendingVerificationResponseDto } from '../../application/dtos/pending-verification-response.dto';
import { ResendVerificationCodeDto } from '../../application/dtos/resend-verification-code.dto';
import { VerifyEmailCodeDto } from '../../application/dtos/verify-email-code.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { RegisterResponseDto } from '../../application/dtos/register-response.dto';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { SessionResponseDto } from '../../application/dtos/session-response.dto';
import { VerificationResponseDto } from '../../application/dtos/verification-response.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { ResendVerificationCodeUseCase } from '../../application/use-cases/resend-verification-code.use-case';
import { VerifyEmailCodeUseCase } from '../../application/use-cases/verify-email-code.use-case';
import {
  toRegisterResponse,
  toRegisterUserInput,
  toSessionResponse,
  toVerifyEmailCodeInput,
} from './auth.mapper';

const VERIFICATION_SENT =
  'Cadastro realizado. Enviamos um código de verificação para o seu e-mail institucional.';

const ACCOUNT_ACTIVATED = 'Conta ativada com sucesso.';

const CODE_RESENT =
  'Se houver uma conta pendente de verificação com este e-mail, enviamos um novo código.';

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
    private readonly verifyEmailCode: VerifyEmailCodeUseCase,
    private readonly resendVerificationCode: ResendVerificationCodeUseCase,
  ) {}

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
}
