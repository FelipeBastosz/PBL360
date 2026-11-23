import type {
  ComparisonAdjustment,
  ComparisonCriterionItem,
  ComparisonPeerEvaluation,
} from '../../domain/entities/evaluation-history.entity';
import type {
  ComparisonPeerItemRow,
  ComparisonPeerRow,
  SelfAdjustmentDetailRow,
} from './evaluation-history.types';

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
