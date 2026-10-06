import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';

import { ComplementObservationDto } from '../../application/dtos/complement-observation.dto';
import {
  ObservationResponseDto,
  StudentObservationsResponseDto,
} from '../../application/dtos/observation-response.dto';
import { RegisterObservationDto } from '../../application/dtos/register-observation.dto';

const UNAUTHORIZED = ApiUnauthorizedResponse({
  description: 'JWT não informado, inválido ou expirado.',
  type: ErrorResponseDto,
});

const NO_SESSION_ACCESS = ApiForbiddenResponse({
  description: 'O usuário não é professor ou não tem acesso à sala da sessão.',
  type: ErrorResponseDto,
});

const SESSION_NOT_FOUND = ApiNotFoundResponse({
  description: 'Sessão não encontrada.',
  type: ErrorResponseDto,
});

const NOT_AUTHOR = ApiForbiddenResponse({
  description: 'Só quem registrou a observação pode alterá-la ou desfazê-la.',
  type: ErrorResponseDto,
});

const OBSERVATION_NOT_FOUND = ApiNotFoundResponse({
  description: 'Observação não encontrada.',
  type: ErrorResponseDto,
});

export const ListStudentObservationsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Lista as observações do aluno na sessão',
    description: 'Mais recentes primeiro, com a contagem de cada marcação.',
  }),
  ApiOkResponse({ type: StudentObservationsResponseDto }),
  UNAUTHORIZED,
  NO_SESSION_ACCESS,
  SESSION_NOT_FOUND,
);

export const RegisterObservationSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Registra uma observação do aluno',
    description:
      'Cada toque num chip de marcação é uma chamada. Exige ao menos uma marcação ou um texto.',
  }),
  ApiBody({ type: RegisterObservationDto }),
  ApiCreatedResponse({ type: ObservationResponseDto }),
  ApiBadRequestResponse({
    description: 'Sem marcação e sem texto, texto acima de 1000 caracteres ou marcações repetidas.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  NO_SESSION_ACCESS,
  SESSION_NOT_FOUND,
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado na sala, ou marcação inativa ou de outro professor.',
    type: ErrorResponseDto,
  }),
);

export const ComplementObservationSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Completa a observação com texto' }),
  ApiBody({ type: ComplementObservationDto }),
  ApiOkResponse({ type: ObservationResponseDto }),
  ApiBadRequestResponse({
    description: 'Texto vazio ou acima de 1000 caracteres.',
    type: ErrorResponseDto,
  }),
  UNAUTHORIZED,
  NOT_AUTHOR,
  OBSERVATION_NOT_FOUND,
);

export const UndoObservationSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Desfaz uma observação registrada por engano',
    description: 'A observação é apagada junto com as suas marcações.',
  }),
  ApiNoContentResponse({ description: 'Observação desfeita.' }),
  UNAUTHORIZED,
  NOT_AUTHOR,
  OBSERVATION_NOT_FOUND,
);
