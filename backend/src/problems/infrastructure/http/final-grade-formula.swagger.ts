import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { FinalGradeFormulaResponseDto } from '../../application/dtos/final-grade-formula-response.dto';

const commonErrors = () => [
  ApiUnauthorizedResponse({
    description: 'JWT inválido ou não informado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({ description: 'O tutor não tem acesso à sala.', type: ErrorResponseDto }),
  ApiNotFoundResponse({
    description: 'Problema não encontrado na sala informada.',
    type: ErrorResponseDto,
  }),
];

export const GetFinalGradeFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Consulta os pesos das sessões na nota final do problema.' }),
  ApiOkResponse({
    description: 'Fórmula retornada com sucesso.',
    type: FinalGradeFormulaResponseDto,
  }),
  ...commonErrors(),
);

export const CustomizeFinalGradeFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Personaliza os pesos relativos das sessões na nota final.' }),
  ApiOkResponse({
    description: 'Fórmula personalizada salva com sucesso.',
    type: FinalGradeFormulaResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Corpo ou tipos de dados inválidos.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Sessão inválida ou peso fora do intervalo permitido.',
    type: ErrorResponseDto,
  }),
  ...commonErrors(),
);

export const RestoreFinalGradeFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Restaura a média simples das sessões.' }),
  ApiOkResponse({ description: 'Fórmula padrão restaurada.', type: FinalGradeFormulaResponseDto }),
  ...commonErrors(),
);
