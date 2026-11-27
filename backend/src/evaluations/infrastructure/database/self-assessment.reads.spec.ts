import { readReceivedFeedbackGrades } from '@/feedbacks/infrastructure/database/received-feedback-grades.reads';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { readSubmittedConfig } from './submitted-student-config.reads';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';
import { getStudentEvaluationSummary, readSelfAssessmentDetail } from './self-assessment.reads';

jest.mock('@/feedbacks/infrastructure/database/received-feedback-grades.reads', () => ({
  readReceivedFeedbackGrades: jest.fn(),
}));
jest.mock('./submitted-student-config.reads', () => ({ readSubmittedConfig: jest.fn() }));
jest.mock('./session-evaluation-config.persistence', () => ({
  readSessionConfig: jest.fn(),
  readSessionTableConfig: jest.fn(),
}));

describe('self-assessment reads', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes missing evaluation counts and marks the grade unavailable when session lookup fails', async () => {
    const manager = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };

    await expect(
      getStudentEvaluationSummary(manager as never, 'session-1', 'student-1'),
    ).resolves.toEqual({
      participating: false,
      tutorEvaluationSubmitted: false,
      peerSubmitted: 0,
      peerTotal: 0,
      gradeAvailable: false,
    });
    expect(readReceivedFeedbackGrades).not.toHaveBeenCalled();
  });

  it('maps summary counts and availability from released session grades', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            participating: true,
            tutorEvaluationSubmitted: true,
            peerSubmitted: '2',
            peerTotal: '3',
          },
        ])
        .mockResolvedValueOnce([{ roomId: 'room-1', problemId: 'problem-1' }]),
    };
    jest.mocked(readReceivedFeedbackGrades).mockResolvedValue({
      released: true,
      finalScore: 8,
      sessions: new Map([['session-1', 7]]),
    });

    await expect(
      getStudentEvaluationSummary(manager as never, 'session-1', 'student-1'),
    ).resolves.toEqual({
      participating: true,
      tutorEvaluationSubmitted: true,
      peerSubmitted: 2,
      peerTotal: 3,
      gradeAvailable: true,
    });
    expect(readReceivedFeedbackGrades).toHaveBeenCalledWith(
      manager,
      'room-1',
      'problem-1',
      'student-1',
    );
  });

  it('loads details with saved evaluation, role score, and effective submitted config', async () => {
    const config = {
      tableId: 'table-1',
      tableName: 'Avaliação',
      frozen: true,
      criteria: [
        { id: 'criterion-1', name: 'Critério', description: '', weight: 10, orderIndex: 1 },
      ],
    };
    const date = new Date();
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'evaluation-1',
            status: EvaluationStatus.DRAFT,
            submittedAt: null,
            sessionScore: null,
            appliedBonus: null,
            calculationVersion: null,
            createdBy: 'student-1',
            createdAt: date,
            updatedBy: null,
            updatedAt: date,
          },
        ])
        .mockResolvedValueOnce([{ role: 'Coordenador', role_score: '9' }])
        .mockResolvedValueOnce([
          { id: 'item-1', evaluationId: 'evaluation-1', criterionId: 'criterion-1', score: '8' },
        ]),
    };
    jest.mocked(readSessionConfig).mockResolvedValue(config);
    jest.mocked(readSubmittedConfig).mockResolvedValue(config);

    await expect(
      readSelfAssessmentDetail(
        manager as never,
        {
          roomId: 'room-1',
          problemId: 'problem-1',
          sessionId: 'session-1',
        },
        'student-1',
      ),
    ).resolves.toMatchObject({
      config,
      evaluation: { id: 'evaluation-1', items: [{ score: 8 }] },
      adjustments: [],
      papel: 'Coordenador',
      roleScore: 9,
    });
    expect(readSubmittedConfig).toHaveBeenCalledWith(
      manager,
      'session-1',
      expect.objectContaining({ id: 'evaluation-1' }),
      config,
    );
  });

  it('uses current table config and returns null evaluation and role when no data exists', async () => {
    const config = { tableId: 'table-1', tableName: 'Atual', frozen: false, criteria: [] };
    const manager = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };
    jest.mocked(readSessionConfig).mockResolvedValue(null);
    jest.mocked(readSessionTableConfig).mockResolvedValue(config);
    jest.mocked(readSubmittedConfig).mockResolvedValue(config);

    await expect(
      readSelfAssessmentDetail(
        manager as never,
        {
          roomId: 'room-1',
          problemId: 'problem-1',
          sessionId: 'session-1',
        },
        'student-1',
      ),
    ).resolves.toMatchObject({
      config,
      evaluation: null,
      adjustments: [],
      papel: null,
      roleScore: null,
    });
    expect(readSessionTableConfig).toHaveBeenCalledWith(manager, 'session-1');
  });
});
