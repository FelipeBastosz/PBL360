import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { RoomStudentResponseDto } from '../../application/dtos/room-student-response.dto';
import { StudentRoomResponseDto } from '../../application/dtos/student-room-response.dto';

export const ListStudentRoomsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Lista as salas do aluno autenticado' }),
  ApiOkResponse({ type: StudentRoomResponseDto, isArray: true }),
  ApiUnauthorizedResponse({ description: 'JWT não informado, inválido ou expirado.' }),
  ApiForbiddenResponse({ description: 'Apenas alunos podem consultar suas salas.' }),
);

export const ListRoomStudentsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Lista os alunos de uma sala' }),
  ApiOkResponse({ type: RoomStudentResponseDto, isArray: true }),
  ApiBadRequestResponse({ description: 'Identificador da sala inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado, inválido ou expirado.' }),
  ApiForbiddenResponse({ description: 'O usuário não é membro autorizado da sala.' }),
  ApiNotFoundResponse({ description: 'Sala não encontrada ou excluída.' }),
);

export const LeaveRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Permite que aluno ou co-tutor saia da turma voluntariamente' }),
  ApiNoContentResponse({ description: 'Saída da turma realizada com sucesso.' }),
  ApiBadRequestResponse({ description: 'Identificador da sala inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'JWT não informado, inválido ou expirado.' }),
  ApiForbiddenResponse({ description: 'O usuário não participa desta sala.' }),
  ApiNotFoundResponse({ description: 'Sala não encontrada ou excluída.' }),
  ApiConflictResponse({
    description: 'O professor responsável não pode sair da turma.',
    type: ErrorResponseDto,
  }),
);
