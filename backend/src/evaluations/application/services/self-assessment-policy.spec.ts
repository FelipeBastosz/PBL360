import {
  ConflictError,
  LockedError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { Session } from '@/sessions/domain/entities/session.entity';
import type { EvaluationDetail } from '../../domain/repositories/evaluation.repository';
import { assertSelfAssessmentCanBeSaved } from './self-assessment-policy';

const now = new Date('2026-10-10T12:00:00.000Z');
const session = {
  selfEvalReleased: true,
  selfEvalDeadline: new Date('2026-10-11T12:00:00.000Z'),
} as Session;
const detail = {
  config: { criteria: [{ id: 'criterion-1' }] },
  evaluation: null,
} as unknown as EvaluationDetail;
const items = [{ criterionId: 'criterion-1', score: 8 }];

describe('self-assessment policy', () => {
  it('rejects students without attendance', () => {
    expect(() => assertSelfAssessmentCanBeSaved(session, false, detail, items, false, now)).toThrow(
      LockedError,
    );
  });

  it('rejects a disabled release and an expired deadline', () => {
    expect(() =>
      assertSelfAssessmentCanBeSaved(
        { ...session, selfEvalReleased: false } as Session,
        true,
        detail,
        items,
        false,
        now,
      ),
    ).toThrow(LockedError);
    expect(() =>
      assertSelfAssessmentCanBeSaved(
        { ...session, selfEvalDeadline: now } as Session,
        true,
        detail,
        items,
        false,
        now,
      ),
    ).toThrow(LockedError);
  });

  it('rejects incomplete submission and resubmission', () => {
    expect(() => assertSelfAssessmentCanBeSaved(session, true, detail, [], true, now)).toThrow(
      UnprocessableEntityError,
    );
    const submitted = {
      ...detail,
      evaluation: { status: EvaluationStatus.SUBMITTED },
    } as EvaluationDetail;
    expect(() =>
      assertSelfAssessmentCanBeSaved(session, true, submitted, items, true, now),
    ).toThrow(ConflictError);
  });

  it('rejects scores above the criterion maximum', () => {
    expect(() =>
      assertSelfAssessmentCanBeSaved(
        session,
        true,
        detail,
        [{ criterionId: 'criterion-1', score: 11 }],
        false,
        now,
      ),
    ).toThrow(UnprocessableEntityError);
  });
});
