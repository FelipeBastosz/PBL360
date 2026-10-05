import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import {
  MemberSessionResponseDto,
  RoomSessionResponseDto,
} from '../../application/dtos/member-session.dto';

const COMMON = [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'O usuário não é professor vinculado nem aluno matriculado na sala.',
    type: ErrorResponseDto,
  }),
];

export const ListRoomSessionsSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Lista as sessões da sala',
    description:
      'Disponível para professores vinculados e alunos matriculados, da mais recente para a mais antiga.',
  }),
  ApiOkResponse({ type: RoomSessionResponseDto, isArray: true }),
  ApiNotFoundResponse({ description: 'Sala não encontrada.', type: ErrorResponseDto }),
  ...COMMON,
);

export const GetMemberSessionSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Consulta uma sessão pelo identificador',
    description: 'Disponível para professores vinculados e alunos matriculados na sala da sessão.',
  }),
  ApiOkResponse({ type: MemberSessionResponseDto }),
  ApiNotFoundResponse({ description: 'Sessão não encontrada.', type: ErrorResponseDto }),
  ...COMMON,
);
