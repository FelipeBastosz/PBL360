import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { ReportFileFormat } from '@/report-files/domain/report-document';

export const ExportSessionReportSwaggerDocs = applyDecorators(
  ApiOperation({
    summary: 'Exporta o relatório da sessão em PDF ou Excel',
    description:
      'Gera um arquivo para download nos formatos PDF ou XLSX com os dados registrados na sessão ' +
      'escolhida pelo professor: chamada, papéis, notas adicionais de papel, marcações, notas ' +
      'e, por padrão, feedbacks dos alunos matriculados. É possível ocultar os nomes dos alunos ' +
      'e remover a seção de feedbacks.',
  }),
  ApiQuery({
    name: 'formato',
    enum: ReportFileFormat,
    description: 'Formato do arquivo para exportação.',
    example: ReportFileFormat.PDF,
  }),
  ApiQuery({
    name: 'ocultarNome',
    required: false,
    type: Boolean,
    description: 'Se verdadeiro, oculta os nomes dos alunos e exibe apenas as matrículas.',
    example: false,
  }),
  ApiQuery({
    name: 'mostrarFeedBack',
    required: false,
    type: Boolean,
    description: 'Se falso, não inclui a seção de feedbacks no relatório.',
    example: false,
  }),
  ApiQuery({
    name: 'mostrarMarcacoes',
    required: false,
    type: Boolean,
    description: 'Se falso, não preenche a coluna de marcações no relatório.',
    example: false,
  }),
  ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ),
  ApiOkResponse({
    description: 'O arquivo do relatório da sessão no formato escolhido (PDF ou XLSX).',
    schema: { type: 'string', format: 'binary' },
  }),
  ApiBadRequestResponse({
    description: 'O formato informado não é PDF nem XLSX, ou o identificador da sessão é inválido.',
    type: ErrorResponseDto,
  }),
  ApiUnauthorizedResponse({
    description: 'JWT não informado, inválido ou expirado.',
    type: ErrorResponseDto,
  }),
  ApiForbiddenResponse({
    description: 'O professor não tem permissão para acessar esta sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão não encontrada.',
    type: ErrorResponseDto,
  }),
  ApiInternalServerErrorResponse({
    description: 'Não foi possível gerar o arquivo do relatório.',
    type: ErrorResponseDto,
  }),
  ApiBearerAuth(JWT_SECURITY_SCHEME),
);
