import type { Feedback } from '@/feedbacks/domain/entities/feedback.entity';
import type { Session } from '@/sessions/domain/entities/session.entity';
import type {
  EvaluationDetail,
  StudentEvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { studentSelfAssessmentStatus } from './student-self-assessment-status';

export function toStudentEvaluationSummary(
  session: Session,
  counts: StudentEvaluationSummary,
  detail: EvaluationDetail,
  feedback: Feedback | null,
  feedbackIsNew: boolean,
  now: Date,
) {
  return {
    self: toSelfSummary(session, counts, detail, now),
    peers: toPeerSummary(session, counts),
    feedback: { available: feedback !== null, new: feedbackIsNew },
  };
}

function toSelfSummary(
  session: Session,
  counts: StudentEvaluationSummary,
  detail: EvaluationDetail,
  now: Date,
) {
  return {
    released: session.selfEvalReleased,
    deadline: session.selfEvalDeadline,
    status: studentSelfAssessmentStatus(
      session,
      counts.participating,
      detail.evaluation?.status ?? null,
      now,
    ),
  };
}

function toPeerSummary(session: Session, counts: StudentEvaluationSummary) {
  return {
    released: session.peerEvalReleased,
    deadline: session.peerEvalDeadline,
    submitted: counts.peerSubmitted,
    total: counts.peerTotal,
  };
}
