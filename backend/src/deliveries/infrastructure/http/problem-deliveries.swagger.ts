import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import {
  ProblemDeliveriesListResponseDto,
  ProblemDeliveryResponseDto,
} from '../../application/dtos/problem-delivery-response.dto';
import { RegisterProblemDeliveryDto } from '../../application/dtos/register-problem-delivery.dto';

const ROUTE_PARAMS = [
  ApiParam({ name: 'salaId', description: 'Identificador UUID da sala', format: 'uuid' }),
  ApiParam({ name: 'problemaId', description: 'Identificador UUID do problema', format: 'uuid' }),
];

const COMMON_RESPONSES = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ...ROUTE_PARAMS,
  ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.', type: ErrorResponseDto }),
  ApiNotFoundResponse({
    description: 'Sala ou problema não encontrado.',
    type: ErrorResponseDto,
  }),
];

export const RegisterProblemDeliverySwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Registra uma entrega por link para o problema',
    description:
      'Permite que um aluno matriculado na sala registre um link HTTPS individual de entrega ' +
      'para o problema, substituindo atomicamente sua entrega vigente anterior caso exista.',
  }),
  ApiBody({ type: RegisterProblemDeliveryDto }),
  ApiCreatedResponse({
    description: 'Entrega registrada com sucesso.',
    type: ProblemDeliveryResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Parâmetro inválido ou URL ausente, vazia, malformada ou não-HTTPS.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Apenas alunos matriculados na sala podem registrar entregas.',
    type: ErrorResponseDto,
  }),
  ...COMMON_RESPONSES,
);

export const ListProblemDeliveriesSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Consulta as entregas vigentes do problema',
    description:
      'Professor responsável e co-tutores consultam todas as entregas vigentes do problema; ' +
      'alunos matriculados consultam apenas a sua própria entrega vigente.',
  }),
  ApiOkResponse({
    description: 'Lista de entregas vigentes do problema.',
    type: ProblemDeliveriesListResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Identificador de sala ou problema inválido.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Usuário sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ...COMMON_RESPONSES,
);
