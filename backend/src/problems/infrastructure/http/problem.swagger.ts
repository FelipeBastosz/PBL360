import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

export const CreateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Cadastra um novo problema na sala',
    description:
      'Permite que um professor vinculado à sala cadastre um novo problema. ' +
      'A ordem do problema na sala é definida automaticamente de forma sequencial.',
  }),
  ApiCreatedResponse({
    description: 'Problema cadastrado com sucesso.',
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos ou erro de validação.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. O professor não possui permissão nesta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada.',
    type: ErrorResponseDto,
  }),
);

export const ListProblemsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista os problemas de uma sala',
    description:
      'Retorna a lista de problemas da sala informada ordenados por ordem de criação. ' +
      'Caso a sala não possua problemas cadastrados, devolve uma lista vazia.',
  }),
  ApiOkResponse({
    description: 'Lista de problemas da sala retornada com sucesso.',
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. O professor não possui permissão nesta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sala não encontrada.',
    type: ErrorResponseDto,
  }),
);

export const GetProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Obtém as informações de um problema da sala',
    description:
      'Retorna os dados detalhados de um problema específico. ' +
      'Caso o problema não exista ou não pertença à sala informada, o sistema responde que ele não existe.',
  }),
  ApiOkResponse({
    description: 'Problema encontrado com sucesso.',
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'Acesso negado. O professor não possui permissão nesta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Problema ou sala não encontrada.',
    type: ErrorResponseDto,
  }),
);
export const UpdateProblemSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Atualiza título de um problema',
    description:
      'Permite que o professor atualize o título de um problema existente na sala. Apenas o campo "title" é editável.',
  }),
  ApiOkResponse({ description: 'Problema atualizado com sucesso.' }),
  ApiBadRequestResponse({ description: 'Dados inválidos ou erro de validação.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado, inválido ou expirado.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Acesso negado.', type: ErrorResponseDto }),
  ApiNotFoundResponse({ description: 'Problema não encontrado.', type: ErrorResponseDto }),
);

