import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { TermAcceptanceStatusResponseDto } from '../../application/dtos/term-acceptance-status-response.dto';

export const GetUserTermAcceptanceSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta o status de aceite do termo do usuário autenticado',
    description:
      'Retorna se a conta já aceitou o termo, a versão aceita, a data/hora do aceite e a versão vigente.',
  }),
  ApiOkResponse({
    description: 'Status de aceite do termo retornado com sucesso.',
    type: TermAcceptanceStatusResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Token de autenticação não fornecido ou inválido.',
    type: ErrorResponseDto,
  }),
);

export const AcceptCommitmentTermSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Registra o aceite do termo de compromisso para o usuário autenticado',
    description:
      'Registra o aceite da versão indicada. No primeiro aceite, exige que a versão seja a vigente (409 caso contrário).',
  }),
  ApiOkResponse({
    description: 'Aceite registrado com sucesso.',
    type: TermAcceptanceStatusResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Corpo da requisição inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Token de autenticação não fornecido ou inválido.',
    type: ErrorResponseDto,
  }),
  ApiConflictResponse({
    description: 'A versão informada não corresponde à versão vigente do termo.',
    type: ErrorResponseDto,
  }),
);
