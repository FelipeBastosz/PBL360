import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { readEvaluation, readEvaluationDetail } from './evaluation.reads';
import { assertSessionExists, freezeSessionConfig } from './session-evaluation-config.persistence';
import { persistAdjustments, persistEvaluationItems } from './evaluation-item.persistence';
import { recordEvaluation } from './evaluation.persistence';

jest.mock('@/sessions/infrastructure/database/session-table-lock.persistence', () => ({
  lockSessionPerformanceTable: jest.fn(),
}));
jest.mock('../../application/services/evaluation-rule-validation', () => ({
  validateEvaluationRules: jest.fn((work: () => unknown) => work()),
}));
jest.mock('./evaluation.reads', () => ({
  readEvaluation: jest.fn(),
  readEvaluationDetail: jest.fn(),
}));
jest.mock('./session-evaluation-config.persistence', () => ({
  freezeSessionConfig: jest.fn(),
  assertSessionExists: jest.fn(),
}));
jest.mock('./evaluation-item.persistence', () => ({
  persistAdjustments: jest.fn(),
  persistEvaluationItems: jest.fn(),
}));

describe('recordEvaluation', () => {
  beforeEach(() => jest.clearAllMocks());

  const input = {
    context: { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
    studentId: 'student-1',
    authorId: 'teacher-1',
    items: [],
    submit: false,
    notaCargo: 8,
  };
  const config = { tableId: 'table-1', tableName: 'Avaliação', criteria: [], frozen: true };
  const evaluation = {
    id: 'evaluation-1',
    status: EvaluationStatus.DRAFT,
    appliedBonus: null,
    revise: jest.fn().mockReturnValue([]),
  };

  it('locks context, freezes config, revises and persists scores and role score transactionally', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'problem-1' }])
        .mockResolvedValueOnce([{ student_id: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ bonus: '6' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const detail = { config, evaluation, adjustments: [], papel: null, roleScore: null };
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readEvaluation).mockResolvedValue(evaluation as never);
    jest.mocked(readEvaluationDetail).mockResolvedValue(detail as never);

    await expect(
      recordEvaluation({ transaction, query: manager.query } as never, input as never),
    ).resolves.toBe(detail);
    const transactionManager = { ...manager, transaction };
    expect(lockSessionPerformanceTable).toHaveBeenCalledWith(transactionManager, 'session-1');
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      'problem-1',
      'room-1',
    ]);
    expect(assertSessionExists).toHaveBeenCalledWith(transactionManager, 'session-1', 'problem-1');
    expect(freezeSessionConfig).toHaveBeenCalledWith(transactionManager, 'session-1', 'teacher-1');
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluations'), [
      'teacher-1',
      'student-1',
      'problem-1',
      'session-1',
      'table-1',
    ]);
    expect(evaluation.revise).toHaveBeenCalledWith(
      expect.objectContaining({ bonus: 8, authorId: 'teacher-1' }),
      config,
    );
    expect(persistAdjustments).toHaveBeenCalledWith(
      transactionManager,
      [],
      'teacher-1',
      '',
      expect.any(Date),
    );
    expect(persistEvaluationItems).toHaveBeenCalledWith(transactionManager, 'evaluation-1', []);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE session_roles'), [
      8,
      'session-1',
      'student-1',
    ]);
    expect(validateEvaluationRules).toHaveBeenCalled();
  });

  it('rejects when the problem is not in the room or the student is not enrolled', async () => {
    const noProblem = { query: jest.fn().mockResolvedValueOnce([]) };
    const noProblemTx = jest.fn((work: (tx: typeof noProblem) => unknown) => work(noProblem));
    await expect(
      recordEvaluation(
        { transaction: noProblemTx, query: noProblem.query } as never,
        input as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    const notEnrolled = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'problem-1' }])
        .mockResolvedValueOnce([]),
    };
    const notEnrolledTx = jest.fn((work: (tx: typeof notEnrolled) => unknown) => work(notEnrolled));
    await expect(
      recordEvaluation(
        { transaction: notEnrolledTx, query: notEnrolled.query } as never,
        input as never,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(freezeSessionConfig).not.toHaveBeenCalled();
  });

  it('uses persisted bonus for submitted evaluations and avoids an extra role update when omitted', async () => {
    const submitted = { ...evaluation, status: EvaluationStatus.SUBMITTED, appliedBonus: 7 };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'problem-1' }])
        .mockResolvedValueOnce([{ student_id: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ bonus: null }])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readEvaluation).mockResolvedValue(submitted as never);
    jest.mocked(readEvaluationDetail).mockResolvedValue({} as never);

    await recordEvaluation({ transaction, query: manager.query } as never, {
      ...input,
      notaCargo: undefined,
    });
    expect(submitted.revise).toHaveBeenCalledWith(expect.objectContaining({ bonus: 7 }), config);
    expect(manager.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE session_roles'),
      expect.anything(),
    );
  });

  it('uses the role bonus for draft evaluations when notaCargo is omitted', async () => {
    const draft = { ...evaluation, status: EvaluationStatus.DRAFT, appliedBonus: null };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'problem-1' }])
        .mockResolvedValueOnce([{ student_id: 'student-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ bonus: '9' }])
        .mockResolvedValueOnce([]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(readEvaluation).mockResolvedValue(draft as never);
    jest.mocked(readEvaluationDetail).mockResolvedValue({} as never);

    await recordEvaluation({ transaction, query: manager.query } as never, {
      ...input,
      notaCargo: undefined,
    });
    expect(draft.revise).toHaveBeenCalledWith(expect.objectContaining({ bonus: 9 }), config);
  });
});
