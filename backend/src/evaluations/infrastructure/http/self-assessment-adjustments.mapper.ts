import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import type { SelfAssessmentAdjustmentWrite } from '../../domain/repositories/self-assessment-adjustment.repository';
import type { AdjustSelfAssessmentDto } from '../../application/dtos/adjust-self-assessment.dto';
import type {
  SelfAssessmentAdjustmentDto,
  SelfAssessmentAdjustmentHistoryResponseDto,
  SelfAssessmentAdjustmentResponseDto,
} from '../../application/dtos/self-assessment-adjustment-response.dto';
import type {
  AdjustedSelfAssessmentOutput,
  SelfAssessmentAdjustmentsOutput,
} from '../../application/services/self-assessment-adjustment-policy';

export const toAdjustSelfAssessmentInput = (
  dto: AdjustSelfAssessmentDto,
  sessionId: string,
  studentId: string,
  authorId: string,
): SelfAssessmentAdjustmentWrite => ({
  sessionId,
  studentId,
  authorId,
  newScore: dto.novaNota,
  justification: dto.justificativa,
  tipo: dto.tipo,
});

export const toSelfAssessmentAdjustmentHistoryResponse = (
  output: SelfAssessmentAdjustmentsOutput,
): SelfAssessmentAdjustmentHistoryResponseDto => ({
  notaOriginal: output.originalScore,
  notaVigente: output.currentScore,
  ajustes: output.adjustments.map(toAdjustment),
});

export const toSelfAssessmentAdjustmentResponse = (
  studentId: string,
  output: AdjustedSelfAssessmentOutput,
): SelfAssessmentAdjustmentResponseDto => ({
  alunoId: studentId,
  notaOriginal: output.originalScore,
  notaVigente: output.currentScore,
  ajuste: toAdjustment(output.adjustment),
});

const toAdjustment = (adjustment: EvaluationAdjustment): SelfAssessmentAdjustmentDto => ({
  valorAnterior: adjustment.previousValue,
  valorNovo: adjustment.newValue,
  justificativa: adjustment.justification,
  autorId: adjustment.authorId,
  criadoEm: adjustment.createdAt,
  autor: { id: adjustment.authorId, nome: adjustment.authorName },
  ajustadoEm: adjustment.createdAt,
});
