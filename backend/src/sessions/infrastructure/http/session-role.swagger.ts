import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import {
  AssignedSessionRoleResponseDto,
  SessionRoleResponseDto,
} from '../../application/dtos/session-role.dto';

const common = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
];

export const ListSessionRolesSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Lista os papéis atribuídos na sessão' }),
  ApiOkResponse({ type: SessionRoleResponseDto, isArray: true }),
  ...common,
);

export const SessionRoleSwaggerDocs = applyDecorators(
  ApiOperation({ summary: 'Atribui, troca ou remove o papel de um aluno' }),
  ApiOkResponse({ type: AssignedSessionRoleResponseDto }),
  ApiBadRequestResponse({ type: ErrorResponseDto }),
  ApiConflictResponse({ description: 'Papel ocupado sem transferência.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({ description: 'Aluno não matriculado.', type: ErrorResponseDto }),
  ...common,
);
