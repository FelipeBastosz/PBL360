import type { Session } from '@/sessions/domain/entities/session.entity';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { studentSelfAssessmentStatus } from './student-self-assessment-status';

describe('studentSelfAssessmentStatus', () => {
  const now = new Date('2026-11-27T12:00:00Z');
  const session = (overrides: Partial<Session> = {}): Session =>
    ({
      selfEvalReleased: true,
      selfEvalDeadline: null,
      ...overrides,
    }) as Session;

  it('returns ENCERRADA when self-evaluation is released, deadline has passed, and not submitted', () => {
    expect(
      studentSelfAssessmentStatus(
        session({ selfEvalDeadline: new Date('2026-11-27T11:59:59Z') }),
        true,
        EvaluationStatus.DRAFT,
        now,
      ),
    ).toBe('ENCERRADA');
  });
});
