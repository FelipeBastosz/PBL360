import { ConflictError, LockedError } from '@/shared/errors/application.error';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { Session } from '@/sessions/domain/entities/session.entity';
import type { EvaluationDetail } from '../../domain/repositories/evaluation.repository';
import { EvaluationRules } from '../../domain/services/evaluation-rules';
import { validateEvaluationRules } from './evaluation-rule-validation';

export function assertSelfAssessmentCanBeSaved(
  session: Session,
  participating: boolean,
  detail: EvaluationDetail,
  items: Array<{ criterionId: string; score: number }>,
  submit: boolean,
  now: Date,
): void {
  assertParticipation(participating);
  assertReleaseOpen(session, now);
  assertNotSubmitted(detail);
  assertValidItems(detail, items, submit);
}

function assertParticipation(participating: boolean): void {
  if (!participating) {
    throw new LockedError('Apenas alunos presentes ou atrasados podem se autoavaliar.');
  }
}

function assertReleaseOpen(session: Session, now: Date): void {
  if (!session.selfEvalReleased) throw new LockedError('A autoavaliação não está liberada.');
  if (session.selfEvalDeadline && session.selfEvalDeadline <= now) {
    throw new LockedError('O prazo para a autoavaliação expirou.');
  }
}

function assertNotSubmitted(detail: EvaluationDetail): void {
  if (detail.evaluation?.status === EvaluationStatus.SUBMITTED) {
    throw new ConflictError('A autoavaliação já foi enviada e não pode ser alterada.');
  }
}

function assertValidItems(
  detail: EvaluationDetail,
  items: Array<{ criterionId: string; score: number }>,
  submit: boolean,
): void {
  validateEvaluationRules(() =>
    EvaluationRules.assertValidItems(items, detail.config.criteria, submit),
  );
}
