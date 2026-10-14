import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type { GradeAdjustment } from '../../domain/entities/grade-adjustment.entity';
import type {
  EvaluationDetail,
  EvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import {
  EvaluationStatusResponse,
  type SessionEvaluationSummaryResponseDto,
} from '../../application/dtos/session-evaluation-summary-response.dto';
import type { TutorEvaluationResponseDto } from '../../application/dtos/tutor-evaluation-response.dto';
import type { ProblemEvaluationCriteriaResponseDto } from '../../application/dtos/problem-evaluation-criteria-response.dto';

export const toEvaluationCriteriaResponse = (
  config: SessionEvaluationConfig,
): ProblemEvaluationCriteriaResponseDto => ({
  tabela: { id: config.tableId, nome: config.tableName },
  criterios: config.criteria.map((criterion) => ({
    id: criterion.id,
    nome: criterion.name,
    descricao: criterion.description,
    peso: criterion.weight,
    notaMaxima: 10,
    ordem: criterion.orderIndex,
  })),
});

export const toTutorEvaluationResponse = (
  detail: EvaluationDetail,
): TutorEvaluationResponseDto => ({
  ...toEvaluationCriteriaResponse(detail.config),
  status: toStatus(detail.evaluation?.status ?? null),
  enviadaEm: detail.evaluation?.submittedAt ?? null,
  itens: (detail.evaluation?.items ?? []).map((item) => ({
    criterioId: item.criterionId,
    nota: item.score,
  })),
  ajustes: detail.adjustments.map(toAdjustmentResponse),
  notaSessao: detail.evaluation?.sessionScore ?? null,
  configuracaoFixada: detail.config.frozen,
  adicionalAplicado: detail.evaluation?.appliedBonus ?? null,
});

export const toEvaluationSummaryResponse = (
  summary: EvaluationSummary,
): SessionEvaluationSummaryResponseDto => ({
  alunoId: summary.studentId,
  nome: summary.name,
  iniciais: initials(summary.name),
  presenca: null,
  status: toStatus(summary.status),
  notaSessao: summary.sessionScore,
});

const toAdjustmentResponse = (adjustment: GradeAdjustment) => ({
  criterioId: adjustment.criterionId,
  valorAnterior: adjustment.previousValue,
  valorNovo: adjustment.newValue,
  justificativa: adjustment.justification,
  autor: { id: adjustment.authorId, nome: adjustment.authorName },
  ajustadoEm: adjustment.createdAt,
});

const toStatus = (status: EvaluationStatus | null): EvaluationStatusResponse => {
  if (status === null) return EvaluationStatusResponse.PENDENTE;
  return status === EvaluationStatus.DRAFT
    ? EvaluationStatusResponse.RASCUNHO
    : EvaluationStatusResponse.ENVIADA;
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  return (first + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
};
