import type { ClosedPlanningPoker } from '../../application/use-cases/close-planning-poker.use-case';
import type { DecidedPokerRound } from '../../application/use-cases/decide-poker-round.use-case';
import type { PlanningPokerAvailability } from '../../application/use-cases/get-planning-poker-availability.use-case';
import type { PlanningPokerStateOutput } from '../../application/use-cases/get-planning-poker-state.use-case';
import type {
  CompletedRound,
  PokerStateView,
  StudentPokerState,
  TutorPokerState,
} from '../../application/services/poker-views';
import { POKER_BLOCK_MESSAGES } from '../../application/services/poker-start-policy';
import {
  PokerOrderPayload,
  type DecidePokerRoundDto,
  PokerDecisionPayload,
} from '../../application/dtos/planning-poker-request.dto';
import type {
  ClosePlanningPokerResponseDto,
  PlanningPokerAvailabilityResponseDto,
  PlanningPokerStateResponseDto,
  PokerCompletedResponseDto,
} from '../../application/dtos/planning-poker-response.dto';
import type { PokerDecisionResponseDto } from '../../application/dtos/poker-round-response.dto';
import { PokerOrder } from '../../domain/entities/planning-poker';
import type { PokerDecisionAction } from '../../application/use-cases/decide-poker-round.use-case';
import {
  toPokerRoundResponse,
  toPokerStudentResponse,
  toStudentPokerRoundResponse,
} from './poker-round.mapper';

export const POKER_ORDER_TO_DOMAIN: Record<PokerOrderPayload, PokerOrder> = {
  [PokerOrderPayload.SEQUENCIAL]: PokerOrder.SEQUENTIAL,
  [PokerOrderPayload.MANUAL]: PokerOrder.MANUAL,
};

const DOMAIN_TO_POKER_ORDER: Record<PokerOrder, PokerOrderPayload> = {
  [PokerOrder.SEQUENTIAL]: PokerOrderPayload.SEQUENCIAL,
  [PokerOrder.MANUAL]: PokerOrderPayload.MANUAL,
};

const studentIdentity = ({ student }: CompletedRound) => ({
  alunoId: student.id,
  nome: student.name,
  iniciais: student.initials,
});

const toTutorCompleted = (round: CompletedRound): PokerCompletedResponseDto => ({
  ...studentIdentity(round),
  media: round.average,
  notaFinal: round.finalGrade,
  ajustada: round.adjusted,
});

const toBaseState = (state: PokerStateView) => ({
  pokerId: state.poker.id,
  anonimo: state.poker.anonymous,
  ordem: DOMAIN_TO_POKER_ORDER[state.poker.order],
  status: 'ABERTO',
  participantes: state.participants.map(toPokerStudentResponse),
  ausentes: state.absentees.map(toPokerStudentResponse),
  fila: state.queue,
});

export const toTutorStateResponse = (state: TutorPokerState): PlanningPokerStateResponseDto => ({
  ...toBaseState(state),
  concluidas: state.completed.map(toTutorCompleted),
  rodadaAtual: state.current ? toPokerRoundResponse(state.current) : null,
});

const toStudentStateResponse = (state: StudentPokerState): PlanningPokerStateResponseDto => ({
  ...toBaseState(state),
  concluidas: state.completed.map(studentIdentity),
  rodadaAtual: state.current ? toStudentPokerRoundResponse(state.current) : null,
  participante: state.isParticipant,
});

export const toPlanningPokerStateResponse = (
  output: PlanningPokerStateOutput,
): PlanningPokerStateResponseDto =>
  output.audience === 'TUTOR'
    ? toTutorStateResponse(output.state)
    : toStudentStateResponse(output.state);

export const toAvailabilityResponse = (
  availability: PlanningPokerAvailability,
): PlanningPokerAvailabilityResponseDto => ({
  disponivel: availability.blockReason === null,
  motivo: availability.blockReason ? POKER_BLOCK_MESSAGES[availability.blockReason] : null,
  presentes: availability.presentStudents,
  pokerAbertoId: availability.openPokerId,
});

export const toDecisionAction = (dto: DecidePokerRoundDto): PokerDecisionAction =>
  dto.acao === PokerDecisionPayload.REAJUSTAR
    ? { type: 'ADJUST', grade: dto.nota ?? 0, justification: dto.justificativa ?? '' }
    : { type: 'ACCEPT' };

export const toDecisionResponse = (decided: DecidedPokerRound): PokerDecisionResponseDto => ({
  alunoId: decided.studentId,
  media: decided.average,
  notaFinal: decided.decision.finalGrade,
  ajustada: decided.decision.adjusted,
  decididoPor: decided.decision.decidedBy,
  decididoEm: decided.decision.decidedAt,
});

export const toCloseResponse = (closed: ClosedPlanningPoker): ClosePlanningPokerResponseDto => ({
  avaliados: closed.evaluated,
  naoAvaliados: closed.notEvaluated.map((student) => ({
    alunoId: student.id,
    nome: student.name,
  })),
  resultados: closed.results.map(({ student, finalGrade, adjusted }) => ({
    alunoId: student.id,
    nome: student.name,
    notaFinal: finalGrade,
    ajustada: adjusted,
  })),
});
