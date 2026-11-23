import {
  EvaluationAdjustmentSituation,
  EvaluationHistoryOrigin,
  type SessionEvaluationHistoryItem,
} from '../../domain/entities/evaluation-history.entity';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import {
  calculateCriteriaScore,
  calculatePeerAverage,
  calculateTutorScore,
} from './evaluation-history-scores';
import { buildPokerHistoryItem } from './evaluation-history-poker.builder';
import type {
  PokerRoundHistoryRow,
  SelfAdjustmentRow,
  SelfEvaluationRow,
  StudentRow,
} from './evaluation-history.types';

export { calculateCriteriaScore, calculatePeerAverage, calculateTutorScore };

export interface HistoryMaps {
  selfMap: Map<string, SelfEvaluationRow>;
  adjustmentMap: Map<string, SelfAdjustmentRow>;
  peerMap: Map<string, number[]>;
  peerAdjustmentMap?: Map<string, { previousValue: number; newValue: number }>;
  peerWindowOpen?: boolean;
  tutorMap: Map<string, Array<{ criterionId: string; score: number }>>;
  tutorBonusMap?: Map<string, number | null>;
  pokerMap?: Map<string, PokerRoundHistoryRow>;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  return (first + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
}

function emptySelfGrades() {
  return {
    notaAluno: null,
    notaAlunoOriginal: null,
    situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
  };
}

function resolveSelfGrades(
  isSubmitted: boolean,
  isAdjusted: boolean,
  sessionScore: string | number | null,
  newValue: string | number | null,
) {
  if (!isSubmitted) return emptySelfGrades();
  const original = sessionScore !== null ? Number(sessionScore) : null;
  const adjusted = isAdjusted && newValue !== null;
  return {
    notaAluno: adjusted ? Number(newValue) : original,
    notaAlunoOriginal: adjusted ? original : null,
    situacaoAjuste: adjusted
      ? EvaluationAdjustmentSituation.AJUSTADA
      : EvaluationAdjustmentSituation.SEM_AJUSTE,
  };
}

function extractStudentScores(
  studentId: string,
  config: ReturnType<typeof resolveHistoryConfig>,
  maps: HistoryMaps,
  expectedPeerCount = 0,
) {
  const peers = maps.peerMap.get(studentId) ?? [];
  const tutor = maps.tutorMap.get(studentId) ?? [];
  const bonus = maps.tutorBonusMap?.get(studentId) ?? null;
  const allPeersSubmitted = expectedPeerCount > 0 && peers.length >= expectedPeerCount;
  const hasPendingPeers = Boolean(maps.peerWindowOpen) && !allPeersSubmitted;
  return {
    notaTutor: calculateTutorScore(tutor, config, bonus),
    notaPares: hasPendingPeers ? null : calculatePeerAverage(peers),
    avaliacoesPares: peers.length,
  };
}

function resolveStudentSelfGrades(studentId: string, maps: HistoryMaps) {
  const self = maps.selfMap.get(studentId);
  const isSubmitted = self?.status === 'SUBMITTED';
  const adjustment = self ? maps.adjustmentMap.get(self.id) : undefined;
  return resolveSelfGrades(
    isSubmitted,
    isSubmitted && Boolean(adjustment),
    self?.sessionScore ?? null,
    adjustment?.newValue ?? null,
  );
}

export type HistoryConfigInput =
  | SessionEvaluationConfig
  | {
      criteria: Array<{ id: string; weight: number }>;
      formula?: { criteriaWeight: number; roleWeight: number };
    }
  | Array<{ id: string; weight: number }>;

function resolveHistoryConfig(config: HistoryConfigInput) {
  if (Array.isArray(config)) {
    return {
      criteria: config,
      formula: { criteriaWeight: 70, roleWeight: 30 },
    };
  }
  return {
    criteria: config.criteria,
    formula: config.formula ?? { criteriaWeight: 70, roleWeight: 30 },
  };
}

function buildPeerAdjustedItem(
  student: StudentRow,
  peerAdj: { previousValue: number; newValue: number },
  scores: ReturnType<typeof extractStudentScores>,
): SessionEvaluationHistoryItem {
  return {
    alunoId: student.alunoId,
    nome: student.nome,
    matricula: student.matricula ?? null,
    notaAluno: null,
    notaAlunoOriginal: peerAdj.previousValue,
    notaTutor: scores.notaTutor,
    notaPares: peerAdj.newValue,
    avaliacoesPares: scores.avaliacoesPares,
    situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
    origem: EvaluationHistoryOrigin.PARES,
  };
}

function resolveOrigin(
  selfGrades: ReturnType<typeof resolveStudentSelfGrades>,
  scores: ReturnType<typeof extractStudentScores>,
): EvaluationHistoryOrigin | null {
  if (selfGrades.notaAluno !== null) return EvaluationHistoryOrigin.AUTOAVALIACAO;
  if (scores.notaPares !== null) return EvaluationHistoryOrigin.PARES;
  if (scores.notaTutor !== null) return EvaluationHistoryOrigin.TUTOR;
  return null;
}

function resolveStudentItem(
  student: StudentRow,
  selfGrades: ReturnType<typeof resolveStudentSelfGrades>,
  scores: ReturnType<typeof extractStudentScores>,
  peerAdj?: { previousValue: number; newValue: number },
): SessionEvaluationHistoryItem {
  if (peerAdj && selfGrades.notaAluno === null) {
    return buildPeerAdjustedItem(student, peerAdj, scores);
  }
  return {
    alunoId: student.alunoId,
    nome: student.nome,
    matricula: student.matricula ?? null,
    ...selfGrades,
    ...scores,
    origem: resolveOrigin(selfGrades, scores),
  };
}

export function buildHistoryStudentItem(
  student: StudentRow,
  config: HistoryConfigInput,
  maps: HistoryMaps,
  expectedPeerCount = 0,
): SessionEvaluationHistoryItem {
  const cfg = resolveHistoryConfig(config);
  const self = resolveStudentSelfGrades(student.alunoId, maps);
  const scores = extractStudentScores(student.alunoId, cfg, maps, expectedPeerCount);
  const pokerRound = maps.pokerMap?.get(student.alunoId);
  if (pokerRound && self.notaAluno === null) {
    return buildPokerHistoryItem(student, pokerRound, scores.notaTutor);
  }
  return resolveStudentItem(student, self, scores, maps.peerAdjustmentMap?.get(student.alunoId));
}
