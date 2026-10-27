import {
  EvaluationAdjustmentSituation,
  type ComparisonAdjustment,
  type ComparisonCriterionItem,
  type ComparisonPeerEvaluation,
  type SessionEvaluationHistoryItem,
} from '../../domain/entities/evaluation-history.entity';
import type {
  ComparisonPeerItemRow,
  ComparisonPeerRow,
  SelfAdjustmentDetailRow,
  SelfAdjustmentRow,
  SelfEvaluationRow,
  StudentRow,
} from './evaluation-history.types';

export interface HistoryMaps {
  selfMap: Map<string, SelfEvaluationRow>;
  adjustmentMap: Map<string, SelfAdjustmentRow>;
  peerMap: Map<string, number[]>;
  tutorMap: Map<string, Array<{ criterionId: string; score: number }>>;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  return (first + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
}

export function calculateCriteriaScore(
  items: Array<{ criterionId: string; score: number }>,
  criteria: Array<{ id: string; weight: number }>,
): number | null {
  if (items.length === 0) return null;
  const scoreMap = new Map(items.map((i) => [i.criterionId, i.score]));
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of criteria) {
    const sc = scoreMap.get(c.id);
    if (sc !== undefined) {
      weightedSum += sc * c.weight;
      totalWeight += c.weight;
    }
  }
  return totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : null;
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

function calculatePeerAverage(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  return Number(avg.toFixed(2));
}

function extractStudentScores(
  studentId: string,
  criteria: Array<{ id: string; weight: number }>,
  maps: HistoryMaps,
) {
  const peers = maps.peerMap.get(studentId) ?? [];
  const tutor = maps.tutorMap.get(studentId) ?? [];
  return {
    notaTutor: calculateCriteriaScore(tutor, criteria),
    notaPares: calculatePeerAverage(peers),
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

export function buildHistoryStudentItem(
  student: StudentRow,
  criteria: Array<{ id: string; weight: number }>,
  maps: HistoryMaps,
): SessionEvaluationHistoryItem {
  return {
    alunoId: student.alunoId,
    nome: student.nome,
    matricula: student.matricula ?? null,
    ...resolveStudentSelfGrades(student.alunoId, maps),
    ...extractStudentScores(student.alunoId, criteria, maps),
  };
}

export function buildComparisonCriteriaItens(
  criteria: Array<{ id: string; name: string }>,
  selfScores: Map<string, number>,
  tutorScores: Map<string, number>,
): ComparisonCriterionItem[] {
  return criteria.map((c) => ({
    criterioId: c.id,
    nome: c.name,
    notaAluno: selfScores.has(c.id) ? selfScores.get(c.id)! : null,
    notaTutor: tutorScores.has(c.id) ? tutorScores.get(c.id)! : null,
  }));
}

export function buildComparisonPeers(
  peerRows: ComparisonPeerRow[],
  itemsMap: Map<string, ComparisonPeerItemRow[]>,
): ComparisonPeerEvaluation[] {
  return peerRows.map((p) => ({
    avaliadorId: p.avaliadorId,
    avaliadorNome: p.avaliadorNome,
    enviadaEm: p.enviadaEm,
    notaConsolidada: Number(p.notaConsolidada),
    itens: (itemsMap.get(p.id) ?? []).map((it) => ({
      criterioId: it.criterionId,
      nota: Number(it.score),
    })),
  }));
}

export function buildComparisonAdjustments(
  rows: SelfAdjustmentDetailRow[],
): ComparisonAdjustment[] {
  return rows.map((a) => ({
    valorAnterior: Number(a.previousValue),
    valorNovo: Number(a.newValue),
    justificativa: a.justification,
    autor: { id: a.authorId, nome: a.authorName },
    ajustadoEm: a.createdAt,
  }));
}
