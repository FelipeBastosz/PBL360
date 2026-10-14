import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  CastPokerVoteDto,
  DecidePokerRoundDto,
  OpenPokerRoundDto,
} from '../../application/dtos/planning-poker-request.dto';
import {
  PokerDecisionResponseDto,
  PokerRevealResponseDto,
  PokerRoundResponseDto,
  PokerVoteResponseDto,
} from '../../application/dtos/poker-round-response.dto';
import { errorDoc, pokerDocs } from './poker-swagger.helpers';

export const OpenPokerRoundSwaggerDocs = pokerDocs(
  'Abre a rodada do próximo aluno',
  'Sem aluno informado, usa o primeiro da fila (modo sequencial). No modo anônimo os lugares ' +
    'são sorteados e vêm sem identificação.',
  ApiBody({ type: OpenPokerRoundDto }),
  ApiCreatedResponse({ type: PokerRoundResponseDto }),
  errorDoc(ApiBadRequestResponse, 'Aluno não informado no modo MANUAL.'),
  errorDoc(ApiConflictResponse, 'Há rodada aberta ainda não decidida.'),
  errorDoc(ApiUnprocessableEntityResponse, 'Aluno que não participou da sessão ou já avaliado.'),
);

export const CancelPokerRoundSwaggerDocs = pokerDocs(
  'Cancela a rodada antes da decisão',
  'Descarta os votos e devolve o aluno ao início da fila.',
  ApiNoContentResponse({ description: 'Rodada cancelada.' }),
  errorDoc(ApiConflictResponse, 'A rodada já foi decidida.'),
);

export const CastPokerVoteSwaggerDocs = pokerDocs(
  'Registra ou troca o voto do aluno autenticado',
  'Aceito enquanto a rodada não foi revelada.',
  ApiBody({ type: CastPokerVoteDto }),
  ApiOkResponse({ type: PokerVoteResponseDto }),
  errorDoc(ApiBadRequestResponse, 'Nota fora do intervalo ou com mais de duas casas.'),
  errorDoc(ApiConflictResponse, 'Rodada já revelada.'),
);

export const RevealPokerRoundSwaggerDocs = pokerDocs(
  'Revela os votos da rodada',
  'A média considera só quem votou. No modo anônimo os votos vêm sem votante.',
  ApiOkResponse({ type: PokerRevealResponseDto }),
  errorDoc(ApiConflictResponse, 'Rodada já revelada.'),
);

export const RestartPokerVotingSwaggerDocs = pokerDocs(
  'Descarta os votos e reabre a votação',
  'Só depois de revelar e antes de decidir. Gera novo sorteio de lugares no modo anônimo.',
  ApiOkResponse({ type: PokerRoundResponseDto }),
  errorDoc(ApiConflictResponse, 'Rodada não revelada ou já decidida.'),
);

export const DecidePokerRoundSwaggerDocs = pokerDocs(
  'Aceita a média ou reajusta a nota',
  'O reajuste exige nota de 0 a 10 e justificativa de 10 a 500 caracteres.',
  ApiBody({ type: DecidePokerRoundDto }),
  ApiOkResponse({ type: PokerDecisionResponseDto }),
  errorDoc(ApiBadRequestResponse, 'Corpo inválido.'),
  errorDoc(ApiConflictResponse, 'Rodada não revelada ou já decidida.'),
  errorDoc(ApiUnprocessableEntityResponse, 'Aceitar a média de uma rodada sem votos.'),
);
