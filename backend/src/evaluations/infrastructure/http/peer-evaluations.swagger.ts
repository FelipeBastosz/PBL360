import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JWT_SECURITY_SCHEME } from '@/config/swagger.config';
import { ErrorResponseDto } from '@/shared/dtos/error-response.dto';
import { SessionPeersResponseDto } from '../../application/dtos/session-peers-response.dto';
import { PeerEvaluationResponseDto } from '../../application/dtos/peer-evaluation-response.dto';
import { SavePeerEvaluationDto } from '../../application/dtos/save-peer-evaluation.dto';

const accessDocs = () => [
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto }),
  ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto }),
  ApiForbiddenResponse({
    description: 'Aluno sem vínculo com a sala.',
    type: ErrorResponseDto,
  }),
  ApiNotFoundResponse({
    description: 'Sessão, problema ou sala não encontrados.',
    type: ErrorResponseDto,
  }),
];

export const ListSessionPeersSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary:
      'Colegas que o aluno autenticado deve avaliar na sessão, com o status de cada avaliação',
    description:
      'Retorna a lista de colegas presentes na sessão a serem avaliados pelo aluno autenticado, com o status de cada avaliação.',
  }),
  ApiOkResponse({ type: SessionPeersResponseDto }),
);

export const GetPeerEvaluationSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Formulário e respostas da avaliação de um colega',
    description:
      'Retorna o formulário, os critérios de avaliação e as notas salvas para o colega especificado.',
  }),
  ApiOkResponse({ type: PeerEvaluationResponseDto }),
  ApiUnprocessableEntityResponse({
    description: 'Colega que não participou da sessão ou o próprio aluno.',
    type: ErrorResponseDto,
  }),
  ApiResponse({
    status: 423,
    description: 'Avaliador que não participou da sessão.',
    type: ErrorResponseDto,
  }),
);

export const SavePeerEvaluationSwaggerDocs = applyDecorators(
  ...accessDocs(),
  ApiOperation({
    summary: 'Salva o rascunho ou envia a avaliação do colega',
    description:
      'Salva as notas atribuídas ao colega em formato de rascunho ou realiza o envio definitivo. Ao enviar, todos os critérios da sessão são obrigatórios.',
  }),
  ApiBody({ type: SavePeerEvaluationDto }),
  ApiOkResponse({ type: PeerEvaluationResponseDto }),
  ApiConflictResponse({
    description: 'Avaliação já enviada.',
    type: ErrorResponseDto,
  }),
  ApiResponse({
    status: 423,
    description: 'Liberação desligada, prazo vencido ou avaliador que não participou.',
    type: ErrorResponseDto,
  }),
  ApiUnprocessableEntityResponse({
    description: 'Colega inválido, critério fora da tabela ou nota fora do limite.',
    type: ErrorResponseDto,
  }),
);
