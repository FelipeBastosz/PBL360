import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SaveTutorEvaluationDto } from '../../application/dtos/save-tutor-evaluation.dto';
import { TutorEvaluationResponseDto } from '../../application/dtos/tutor-evaluation-response.dto';
import { SessionEvaluationSummaryResponseDto } from '../../application/dtos/session-evaluation-summary-response.dto';

const accessDocs = () => [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Professor sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão, problema ou sala não encontrados.',
    type: ErrorResponseDto,
  }),
];
export const ListSessionEvaluationsSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Lista alunos e o andamento das avaliações da sessão',
    description:
      'Inclui alunos pendentes. Presença permanece null até a integração com chamada. Nota da sessão é preenchida após envio.',
  }),
  ApiOkResponse({ type: SessionEvaluationSummaryResponseDto, isArray: true }),
);
export const GetTutorEvaluationSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Consulta a avaliação e os ajustes do aluno',
    description:
      'Retorna PENDENTE quando não há avaliação. Critérios e pesos são os preservados para a sessão; antes do primeiro salvamento, retorna uma prévia da tabela atual sem gravar configuração.',
  }),
  ApiOkResponse({ type: TutorEvaluationResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Aluno não matriculado ou problema sem tabela.',
    type: ErrorResponseDto,
  }),
);
export const SaveTutorEvaluationSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Salva, envia ou ajusta a avaliação do tutor',
    description:
      'Uma avaliação compartilhada por aluno e sessão. O primeiro salvamento fixa critérios e pesos para todos. A lista substitui o rascunho. Envio exige todos os critérios. Após envio, alterações exigem justificativa de 10 a 500 caracteres e geram histórico por item; não é permitido voltar a rascunho. Cálculo: média ponderada mais adicional preservado no envio, limitado a 10 e arredondado ao final para duas casas. Não há personalização de fórmula nesta rota.',
  }),
  ApiBody({ type: SaveTutorEvaluationDto }),
  ApiOkResponse({ type: TutorEvaluationResponseDto }),
  ApiBadRequestResponse({
    description: 'Formato inválido, justificativa inválida ou tentativa de voltar a rascunho.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description:
      'Aluno não matriculado, tabela ausente, critério inválido/repetido, nota fora de 0–10, critérios faltando no envio ou soma dos pesos zero.',
    type: ErrorResponseDto,
  }),
);
