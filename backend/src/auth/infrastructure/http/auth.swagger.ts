import { PendingVerificationResponseDto } from '@/auth/application/dtos/pending-verification-response.dto';
import { RegisterResponseDto } from '@/auth/application/dtos/register-response.dto';
import { SessionResponseDto } from '@/auth/application/dtos/session-response.dto';
import { VerificationResponseDto } from '@/auth/application/dtos/verification-response.dto';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { PasswordResetTokenResponseDto } from '@/auth/application/dtos/password-reset-token-response.dto';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

const TOO_MANY_REQUESTS = ApiTooManyRequestsResponse({
  description: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.',
  type: ErrorResponseDto,
});

export const RegisterAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Cadastra um usuário',
    description:
      'Cria a conta inativa e envia um código de verificação para o e-mail institucional. ' +
      'Nenhum token é emitido aqui: use o `usuarioId` devolvido em /autenticacao/verificar-codigo ' +
      'para ativar a conta. PROFESSOR pode omitir matrícula e foto; ALUNO precisa das duas.',
  }),
  ApiCreatedResponse({
    description: 'Conta criada, pendente de verificação.',
    type: RegisterResponseDto,
  }),
  ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto }),
  ApiConflictResponse({ description: 'E-mail já cadastrado.', type: ErrorResponseDto }),
);

export const LoginAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({ summary: 'Autentica um usuário', description: 'Devolve o token JWT da sessão.' }),
  ApiOkResponse({ description: 'Credenciais válidas.', type: SessionResponseDto }),
  ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Credenciais inválidas.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description:
      'Conta pendente de verificação. O corpo traz o `usuarioId` e o `email` necessários ' +
      'em /autenticacao/verificar-codigo.',
    type: PendingVerificationResponseDto,
  }),
);

export const VerifyCodeAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Ativa a conta com o código recebido por e-mail',
    description: 'Valida o código, marca a conta como ativa e devolve o token JWT da sessão.',
  }),
  ApiOkResponse({ description: 'Conta ativada.', type: VerificationResponseDto }),
  ApiBadRequestResponse({
    description: 'Código inválido, expirado ou conta já verificada.',
    type: ErrorResponseDto,
  }),
);

export const ResendCodeAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Reenvia o código de verificação',
    description:
      'Invalida os códigos pendentes e envia um novo. A resposta é sempre a mesma, exista ' +
      'ou não uma conta pendente com o e-mail informado, para não revelar quem está cadastrado. ' +
      'Pedidos repetidos dentro de 60 segundos não disparam um novo e-mail.',
  }),
  ApiOkResponse({ description: 'Pedido recebido.', type: MessageResponseDto }),
  ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto }),
);

export const RequestPasswordResetAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Solicita a recuperação de senha',
    description:
      'Gera e envia um código de recuperação. Resposta sempre igual, exista ou não a conta. ' +
      'Cooldown de 60s por conta; limite de 5 pedidos por IP a cada 15 min.',
  }),
  ApiOkResponse({ description: 'Pedido recebido.', type: MessageResponseDto }),
  ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto }),
);

export const ValidatePasswordResetCodeAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Valida o código de recuperação de senha',
    description:
      'Devolve um token de curta duração, usado só em /autenticacao/redefinir-senha. ' +
      'Limitado a 5 tentativas por IP a cada 15 minutos, além do limite de 5 tentativas por código.',
  }),
  ApiOkResponse({ description: 'Código válido.', type: PasswordResetTokenResponseDto }),
  ApiBadRequestResponse({ description: 'Código inválido ou expirado.', type: ErrorResponseDto }),
);

export const ResetPasswordAuthSwaggerDocs = applyDecorators(
  TOO_MANY_REQUESTS,
  ApiOperation({
    summary: 'Redefine a senha',
    description:
      'Aplica a nova senha usando o token devolvido por /autenticacao/recuperacao-senha/validar-codigo.',
  }),
  ApiOkResponse({ description: 'Senha redefinida.', type: MessageResponseDto }),
  ApiBadRequestResponse({
    description: 'Token inválido, expirado ou payload inválido.',
    type: ErrorResponseDto,
  }),
);
