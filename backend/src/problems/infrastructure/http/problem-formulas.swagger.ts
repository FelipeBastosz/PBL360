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
import { FormulaResponseDto } from '../../application/dtos/formula-response.dto';

export const GetProblemFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Obtém a fórmula de avaliação (padrão ou personalizada)',
    description: 'Retorna a fórmula de avaliação para o escopo pedido. Se o professor não tiver personalizado, retorna a fórmula padrão convertida a partir da tabela de desempenho vinculada.',
  }),
  ApiOkResponse({
    description: 'Fórmula retornada com sucesso.',
    type: FormulaResponseDto,
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
  ApiUnprocessableEntityResponse({
    description: 'O problema não possui uma tabela de desempenho vinculada.',
    type: ErrorResponseDto,
  }),
);

export const CustomizeProblemFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Personaliza a fórmula de avaliação',
    description: 'Salva uma nova versão personalizada da fórmula com os pesos informados. A soma deve ser exatamente 100.',
  }),
  ApiOkResponse({
    description: 'Fórmula personalizada salva com sucesso.',
    type: FormulaResponseDto,
  }),
  ApiBadRequestResponse({
    description: 'Dados inválidos ou erro de validação na estrutura.',
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
    description: 'Problema ou sala não encontrada.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Soma dos pesos diferente de 100, componente de outro escopo ou critério inválido.',
    type: ErrorResponseDto,
  }),
);

export const RestoreDefaultFormulaSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Restaura a fórmula padrão da avaliação',
    description: 'Desativa a fórmula personalizada atual, fazendo o sistema voltar a usar a fórmula padrão em memória.',
  }),
  ApiOkResponse({
    description: 'Fórmula restaurada com sucesso para o padrão.',
    type: FormulaResponseDto,
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
