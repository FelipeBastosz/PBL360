import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ClassFinalReportResponseDto } from '../../application/dtos/class-final-report-response.dto';

export const GetClassFinalReportSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({
    summary: 'Gera os dados do relatório final da turma',
    description:
      'Reúne as notas finais de todos os problemas da sala e calcula a média geral de cada aluno, servindo de base para o relatório final do tutor.',
  }),
  ApiParam({
    name: 'salaId',
    format: 'uuid',
    description: 'Identificador único da sala/turma.',
  }),
  ApiOkResponse({
    description: 'Dados do relatório final da turma gerados com sucesso.',
    type: ClassFinalReportResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'Token de autenticação não fornecido ou inválido.',
    schema: {
      example: { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
    },
  }),
  ApiForbiddenResponse({
    description: 'Usuário não possui permissão para acessar esta sala.',
    schema: {
      example: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' },
    },
  }),
  ApiNotFoundResponse({
    description: 'Sala informada não foi encontrada.',
    schema: {
      example: { statusCode: 404, message: 'Sala não encontrada', error: 'Not Found' },
    },
  }),
);
