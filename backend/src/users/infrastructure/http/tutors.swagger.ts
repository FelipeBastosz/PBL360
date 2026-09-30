import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { TutorResponseDto } from '../../application/dtos/tutor-response.dto';

export const SearchTutorsSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Busca professores pelo e-mail',
    description:
      'Busca por trecho literal do e-mail, sem diferenciar maiúsculas. Retorna até 20 professores, ordenados por nome e ID.',
  }),
  ApiOkResponse({ type: TutorResponseDto, isArray: true }),
  ApiBadRequestResponse({ description: 'Busca inválida.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Autenticação obrigatória.', type: ErrorResponseDto }),
  ApiForbiddenResponse({ description: 'Apenas professores podem buscar.', type: ErrorResponseDto }),
);
