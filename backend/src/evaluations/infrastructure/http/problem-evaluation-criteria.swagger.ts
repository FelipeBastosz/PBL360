import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ProblemEvaluationCriteriaResponseDto } from '../../application/dtos/problem-evaluation-criteria-response.dto';

export const GetProblemEvaluationCriteriaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Consulta os critérios atuais da tabela do problema',
    description:
      'A nota máxima é sempre 10. Para avaliar uma sessão já iniciada, utilize a configuração preservada retornada na consulta individual da avaliação.',
  }),
  ApiOkResponse({ type: ProblemEvaluationCriteriaResponseDto }),
  ApiBadRequestResponse({ description: 'Identificador inválido.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Professor sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({ description: 'Sala ou problema não encontrado.', type: ErrorResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Problema sem tabela vinculada. Vincule uma tabela em Fórmulas.',
    type: ErrorResponseDto,
  }),
);
