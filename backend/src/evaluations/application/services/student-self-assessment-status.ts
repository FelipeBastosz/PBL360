import type { Session } from '@/sessions/domain/entities/session.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';

export type StudentSelfAssessmentStatus =
  'INDISPONIVEL' | 'PENDENTE' | 'RASCUNHO' | 'ENVIADA' | 'ENCERRADA' | 'NAO_PARTICIPOU';

export function studentSelfAssessmentStatus(
  session: Session,
  participating: boolean,
  evaluationStatus: EvaluationStatus | null,
  now: Date,
): StudentSelfAssessmentStatus {
  if (!participating) return 'NAO_PARTICIPOU';
  if (evaluationStatus === EvaluationStatus.SUBMITTED) return 'ENVIADA';
  if (!session.selfEvalReleased) return 'INDISPONIVEL';
  if (session.selfEvalDeadline && session.selfEvalDeadline <= now) return 'ENCERRADA';
  return evaluationStatus === EvaluationStatus.DRAFT ? 'RASCUNHO' : 'PENDENTE';
}
