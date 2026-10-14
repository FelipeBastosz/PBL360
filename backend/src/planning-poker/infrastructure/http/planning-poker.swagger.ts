import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  ReorderPokerQueueDto,
  StartPlanningPokerDto,
} from '../../application/dtos/planning-poker-request.dto';
import {
  ClosePlanningPokerResponseDto,
  PlanningPokerAvailabilityResponseDto,
  PlanningPokerStateResponseDto,
  PokerQueueResponseDto,
} from '../../application/dtos/planning-poker-response.dto';
import { errorDoc, pokerDocs } from './poker-swagger.helpers';

export const StartPlanningPokerSwaggerDocs = pokerDocs(
  'Inicia o planning poker na sessão',
  'Abre a avaliação coletiva de pares sobre a mesa da chamada. Participam os alunos ' +
    'presentes ou atrasados. Bloqueia a liberação do formulário de pares na mesma sessão.',
  ApiBody({ type: StartPlanningPokerDto }),
  ApiCreatedResponse({ type: PlanningPokerStateResponseDto }),
  errorDoc(ApiBadRequestResponse, 'Corpo inválido.'),
  errorDoc(
    ApiConflictResponse,
    'Planning poker já aberto, chamada não salva, formulário de pares já liberado ou ' +
      'menos de dois alunos presentes.',
  ),
);

export const GetPlanningPokerStateSwaggerDocs = pokerDocs(
  'Consulta o estado atual do planning poker',
  'Usado também para ressincronizar depois de queda de conexão. O aluno não recebe a nota ' +
    'final, e ninguém recebe o votante no modo anônimo.',
  ApiOkResponse({ type: PlanningPokerStateResponseDto }),
);

export const GetPlanningPokerAvailabilitySwaggerDocs = pokerDocs(
  'Informa se o planning poker pode ser iniciado na sessão',
  'Devolve o motivo quando o início está bloqueado e o planning poker aberto, se houver.',
  ApiOkResponse({ type: PlanningPokerAvailabilityResponseDto }),
);

export const ReorderPokerQueueSwaggerDocs = pokerDocs(
  'Reordena a fila de votação',
  'Disponível no modo sequencial. A fila deve conter exatamente os alunos que ainda faltam.',
  ApiBody({ type: ReorderPokerQueueDto }),
  ApiOkResponse({ type: PokerQueueResponseDto }),
  errorDoc(ApiBadRequestResponse, 'Corpo inválido.'),
  errorDoc(ApiConflictResponse, 'Planning poker no modo em que o professor escolhe.'),
  errorDoc(ApiUnprocessableEntityResponse, 'A fila não corresponde aos alunos pendentes.'),
);

export const ClosePlanningPokerSwaggerDocs = pokerDocs(
  'Encerra o planning poker',
  'Alunos não avaliados ficam sem nota de pares na sessão.',
  ApiOkResponse({ type: ClosePlanningPokerResponseDto }),
  errorDoc(ApiConflictResponse, 'O planning poker já foi encerrado.'),
);
