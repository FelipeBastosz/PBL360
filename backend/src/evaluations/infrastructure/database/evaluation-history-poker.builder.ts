import {
  EvaluationAdjustmentSituation,
  EvaluationHistoryOrigin,
  type ComparisonPlanningPoker,
  type SessionEvaluationHistoryItem,
} from '../../domain/entities/evaluation-history.entity';
import type { PokerRoundHistoryRow, PokerVoteRow, StudentRow } from './evaluation-history.types';

const toNumberOrNull = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

export function mapPokerRounds(rows: PokerRoundHistoryRow[]): Map<string, PokerRoundHistoryRow> {
  return new Map(rows.map((row) => [row.studentId, row]));
}

export function pokerCurrentGrade(round: PokerRoundHistoryRow): number {
  return toNumberOrNull(round.currentGrade) ?? Number(round.finalGrade);
}

export function isPokerRoundAdjusted(round: PokerRoundHistoryRow): boolean {
  return round.adjusted || round.adjustmentCount > 0;
}

const studentIdentity = (student: StudentRow) => ({
  alunoId: student.alunoId,
  nome: student.nome,
  matricula: student.matricula ?? null,
});

export function buildPokerHistoryItem(
  student: StudentRow,
  round: PokerRoundHistoryRow,
  notaTutor: number | null,
): SessionEvaluationHistoryItem {
  const adjusted = isPokerRoundAdjusted(round);
  return {
    ...studentIdentity(student),
    notaAluno: null,
    notaAlunoOriginal: adjusted ? toNumberOrNull(round.average) : null,
    notaTutor,
    notaPares: pokerCurrentGrade(round),
    avaliacoesPares: round.voteCount,
    situacaoAjuste: adjusted
      ? EvaluationAdjustmentSituation.AJUSTADA
      : EvaluationAdjustmentSituation.SEM_AJUSTE,
    origem: EvaluationHistoryOrigin.PLANNING_POKER,
  };
}

const toVote = (anonymous: boolean) => (vote: PokerVoteRow) => ({
  avaliadorId: anonymous ? null : vote.voterId,
  avaliadorNome: anonymous ? null : vote.voterName,
  nota: Number(vote.score),
});

export function buildComparisonPlanningPoker(
  round: PokerRoundHistoryRow,
  votes: PokerVoteRow[],
): ComparisonPlanningPoker {
  return {
    rodadaId: round.id,
    numero: Number(round.roundNumber),
    anonimo: round.anonymous,
    media: toNumberOrNull(round.average),
    notaDecidida: Number(round.finalGrade),
    notaVigente: pokerCurrentGrade(round),
    ajustadaNaMesa: round.adjusted,
    justificativaMesa: round.justification,
    decididaEm: round.decidedAt,
    decididaPor: round.decidedById
      ? { id: round.decidedById, nome: round.decidedByName ?? '' }
      : null,
    votos: votes.map(toVote(round.anonymous)),
  };
}
