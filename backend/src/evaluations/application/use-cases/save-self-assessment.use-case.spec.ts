import {
  ConflictError,
  LockedError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { SaveSelfAssessmentUseCase } from './save-self-assessment.use-case';

describe('SaveSelfAssessmentUseCase', () => {
  const now = new Date('2026-10-10T12:00:00.000Z');
  const access = {
    session: {
      selfEvalReleased: true,
      selfEvalDeadline: new Date('2026-10-11T12:00:00.000Z'),
    },
    problem: { id: 'problem-1' },
    roomId: 'room-1',
  };
  const detail = {
    config: {
      criteria: [{ id: 'criterion-1', name: 'Participação', weight: 10, orderIndex: 1 }],
    },
    evaluation: null,
    adjustments: [],
  };
  const sessionAccess = { assertMemberCanAccessSession: jest.fn() };
  const evaluations = {
    getSelfAssessment: jest.fn(),
    isStudentParticipating: jest.fn(),
    recordSelfAssessment: jest.fn(),
  };
  let useCase: SaveSelfAssessmentUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue(access);
    evaluations.getSelfAssessment.mockResolvedValue(detail);
    evaluations.isStudentParticipating.mockResolvedValue(true);
    evaluations.recordSelfAssessment.mockResolvedValue({
      ...detail,
      evaluation: {
        status: EvaluationStatus.SUBMITTED,
        submittedAt: now,
        sessionScore: 8.5,
        items: [{ criterionId: 'criterion-1', score: 8.5 }],
      },
    });
    useCase = new SaveSelfAssessmentUseCase(
      sessionAccess as unknown as SessionAccessService,
      evaluations as never,
    );
  });

  it('saves a draft', async () => {
    evaluations.recordSelfAssessment.mockResolvedValueOnce({
      ...detail,
      evaluation: {
        status: EvaluationStatus.DRAFT,
        submittedAt: null,
        sessionScore: null,
        items: [{ criterionId: 'criterion-1', score: 6 }],
      },
    });

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      items: [{ criterionId: 'criterion-1', score: 6 }],
      submit: false,
      now,
    });

    expect(result).toMatchObject({ status: 'RASCUNHO', items: [{ score: 6 }] });
    expect(evaluations.recordSelfAssessment).toHaveBeenCalledWith({
      context: { sessionId: 'session-1', problemId: 'problem-1', roomId: 'room-1' },
      studentId: 'student-1',
      items: [{ criterionId: 'criterion-1', score: 6 }],
      submit: false,
    });
  });

  it('submits and returns the consolidated score persisted by the repository', async () => {
    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      items: [{ criterionId: 'criterion-1', score: 8.5 }],
      submit: true,
      now,
    });

    expect(result).toMatchObject({ status: 'ENVIADA', consolidatedScore: 8.5, submittedAt: now });
    expect(evaluations.recordSelfAssessment).toHaveBeenCalledWith(
      expect.objectContaining({ submit: true }),
    );
  });

  it.each([
    [
      'student without attendance',
      false,
      access,
      detail,
      [{ criterionId: 'criterion-1', score: 8 }],
      true,
      LockedError,
    ],
    [
      'disabled release',
      true,
      { ...access, session: { ...access.session, selfEvalReleased: false } },
      detail,
      [{ criterionId: 'criterion-1', score: 8 }],
      true,
      LockedError,
    ],
    [
      'expired deadline',
      true,
      { ...access, session: { ...access.session, selfEvalDeadline: now } },
      detail,
      [{ criterionId: 'criterion-1', score: 8 }],
      true,
      LockedError,
    ],
    ['incomplete submission', true, access, detail, [], true, UnprocessableEntityError],
    [
      'already submitted evaluation',
      true,
      access,
      { ...detail, evaluation: { status: EvaluationStatus.SUBMITTED } },
      [{ criterionId: 'criterion-1', score: 8 }],
      true,
      ConflictError,
    ],
  ])(
    'rejects %s before persisting',
    async (_case, participating, memberAccess, savedDetail, items, submit, error) => {
      sessionAccess.assertMemberCanAccessSession.mockResolvedValue(memberAccess);
      evaluations.isStudentParticipating.mockResolvedValue(participating);
      evaluations.getSelfAssessment.mockResolvedValue(savedDetail);

      await expect(
        useCase.execute({
          sessionId: 'session-1',
          studentId: 'student-1',
          items,
          submit,
          now,
        }),
      ).rejects.toThrow(error);
      expect(evaluations.recordSelfAssessment).not.toHaveBeenCalled();
    },
  );
});
