import {
  EvaluationAdjustmentSituation,
  type ComparisonAdjustment,
  type ComparisonCriterionItem,
  type ComparisonPeerEvaluation,
  type SessionEvaluationHistoryItem,
} from '../../domain/entities/evaluation-history.entity';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import {
  calculateCriteriaScore,
  calculatePeerAverage,
  calculateTutorScore,
} from './evaluation-history-scores';
import type {
  ComparisonPeerItemRow,
  ComparisonPeerRow,
  SelfAdjustmentDetailRow,
  SelfAdjustmentRow,
  SelfEvaluationRow,
  StudentRow,
} from './evaluation-history.types';

export { calculateCriteriaScore, calculatePeerAverage, calculateTutorScore };

export interface HistoryMaps {
  selfMap: Map<string, SelfEvaluationRow>;
  adjustmentMap: Map<string, SelfAdjustmentRow>;
  peerMap: Map<string, number[]>;
  tutorMap: Map<string, Array<{ criterionId: string; score: number }>>;
  tutorBonusMap?: Map<string, number | null>;
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
  config: {
    criteria: Array<{ id: string; weight: number }>;
    formula: { criteriaWeight: number; roleWeight: number };
  },
  maps: HistoryMaps,
) {
  const peers = maps.peerMap.get(studentId) ?? [];
  const tutor = maps.tutorMap.get(studentId) ?? [];
  const bonus = maps.tutorBonusMap?.get(studentId) ?? null;
  return {
    notaTutor: calculateTutorScore(tutor, config, bonus),
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

function resolveHistoryConfig(
  config:
    | SessionEvaluationConfig
    | {
        criteria: Array<{ id: string; weight: number }>;
        formula?: { criteriaWeight: number; roleWeight: number };
      }
    | Array<{ id: string; weight: number }>,
) {
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

export function buildHistoryStudentItem(
  student: StudentRow,
  config:
    | SessionEvaluationConfig
    | {
        criteria: Array<{ id: string; weight: number }>;
        formula?: { criteriaWeight: number; roleWeight: number };
      }
    | Array<{ id: string; weight: number }>,
  maps: HistoryMaps,
): SessionEvaluationHistoryItem {
  const resolvedConfig = resolveHistoryConfig(config);
  return {
    alunoId: student.alunoId,
    nome: student.nome,
    matricula: student.matricula ?? null,
    ...resolveStudentSelfGrades(student.alunoId, maps),
    ...extractStudentScores(student.alunoId, resolvedConfig, maps),
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
