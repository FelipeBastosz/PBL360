import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { RegisterResponseDto } from '../../application/dtos/register-response.dto';
import { RegisterUserDto } from '../../application/dtos/register-user.dto';
import { SessionResponseDto } from '../../application/dtos/session-response.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { toRegisterUserInput, toSessionResponse } from './auth.mapper';

const VERIFICATION_SENT =
  'Cadastro realizado. Enviamos um código de verificação para o seu e-mail institucional.';

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post('registro')
  @ApiOperation({
    summary: 'Cadastra um usuário',
    description:
      'Cria a conta, envia um código de verificação para o e-mail institucional e devolve ' +
      'o token JWT. PROFESSOR pode omitir matrícula e foto; ALUNO precisa das duas.',
  })
  @ApiCreatedResponse({ description: 'Conta criada.', type: RegisterResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.', type: ErrorResponseDto })
  async register(@Body() dto: RegisterUserDto): Promise<RegisterResponseDto> {
    const session = await this.registerUser.execute(toRegisterUserInput(dto));

    return { mensagem: VERIFICATION_SENT, ...toSessionResponse(session) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuário', description: 'Devolve o token JWT da sessão.' })
  @ApiOkResponse({ description: 'Credenciais válidas.', type: SessionResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou conta desativada.',
    type: ErrorResponseDto,
  })
  async signIn(@Body() dto: LoginDto): Promise<SessionResponseDto> {
    return toSessionResponse(await this.login.execute({ email: dto.email, password: dto.senha }));
  }
}
