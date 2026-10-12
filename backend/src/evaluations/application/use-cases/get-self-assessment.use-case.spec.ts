import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { GetSelfAssessmentUseCase } from './get-self-assessment.use-case';

describe('GetSelfAssessmentUseCase', () => {
  const now = new Date('2026-10-10T12:00:00.000Z');
  const access = {
    session: { selfEvalReleased: true, selfEvalDeadline: null },
    problem: { id: 'problem-1' },
    roomId: 'room-1',
  };
  const sessionAccess = { assertMemberCanAccessSession: jest.fn() };
  const evaluations = {
    getSelfAssessment: jest.fn(),
    isStudentParticipating: jest.fn(),
  };
  let useCase: GetSelfAssessmentUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    sessionAccess.assertMemberCanAccessSession.mockResolvedValue(access);
    evaluations.getSelfAssessment.mockResolvedValue({
      config: {
        criteria: [{ id: 'criterion-1', name: 'Participação', weight: 10, orderIndex: 1 }],
      },
      evaluation: {
        status: EvaluationStatus.DRAFT,
        submittedAt: null,
        items: [{ criterionId: 'criterion-1', score: 7 }],
      },
      adjustments: [],
    });
    evaluations.isStudentParticipating.mockResolvedValue(true);
    useCase = new GetSelfAssessmentUseCase(
      sessionAccess as unknown as SessionAccessService,
      evaluations as never,
    );
  });

  it('returns the student assessment and draft items', async () => {
    await expect(useCase.execute('session-1', 'student-1', now)).resolves.toMatchObject({
      status: 'RASCUNHO',
      criteria: [{ id: 'criterion-1', name: 'Participação' }],
      items: [{ criterionId: 'criterion-1', score: 7 }],
    });
    expect(sessionAccess.assertMemberCanAccessSession).toHaveBeenCalledWith('session-1', {
      id: 'student-1',
      type: 'STUDENT',
    });
  });

  it('reports non-participating students as unavailable for self-assessment', async () => {
    evaluations.isStudentParticipating.mockResolvedValue(false);

    await expect(useCase.execute('session-1', 'student-1', now)).resolves.toMatchObject({
      status: 'NAO_PARTICIPOU',
    });
  });
});
