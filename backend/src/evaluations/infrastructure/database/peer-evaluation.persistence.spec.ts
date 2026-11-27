import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { freezeSessionConfig } from './session-evaluation-config.persistence';
import { findPeerOrThrow } from './peer-evaluation.reads';
import { recordPeerEvaluation } from './peer-evaluation.persistence';

jest.mock('@/sessions/infrastructure/database/session-table-lock.persistence', () => ({
  lockSessionPerformanceTable: jest.fn(),
}));
jest.mock('../../application/services/evaluation-rule-validation', () => ({
  validateEvaluationRules: jest.fn((work: () => unknown) => work()),
}));
jest.mock('./session-evaluation-config.persistence', () => ({ freezeSessionConfig: jest.fn() }));
jest.mock('./peer-evaluation.reads', () => ({ findPeerOrThrow: jest.fn() }));

describe('recordPeerEvaluation', () => {
  beforeEach(() => jest.clearAllMocks());

  const input = {
    sessionId: 'session-1',
    problemId: 'problem-1',
    evaluatorId: 'student-1',
    peerId: 'student-2',
    items: [{ criterionId: 'criterion-1', score: 8 }],
    submit: false,
  };
  const config = {
    tableId: 'table-1',
    tableName: 'Avaliação',
    frozen: true,
    criteria: [{ id: 'criterion-1', name: 'Critério', description: '', weight: 10, orderIndex: 0 }],
  };

  it('creates a peer evaluation draft, persists items, and returns the mapped detail', async () => {
    const updated = {
      id: 'evaluation-1',
      status: EvaluationStatus.DRAFT,
      submittedAt: null,
      sessionScore: null,
      appliedBonus: null,
      calculationVersion: null,
      createdBy: 'student-1',
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: new Date(),
    };
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'evaluation-1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([updated])
        .mockResolvedValueOnce([
          { id: 'item-1', evaluationId: 'evaluation-1', criterionId: 'criterion-1', score: '8' },
        ]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(findPeerOrThrow).mockResolvedValue({ id: 'student-2', name: 'Bia', papel: null });
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);

    await expect(
      recordPeerEvaluation({ transaction } as never, input as never),
    ).resolves.toMatchObject({
      peer: { id: 'student-2', name: 'Bia' },
      config,
      evaluation: { id: 'evaluation-1', items: [{ score: 8 }] },
    });
    expect(lockSessionPerformanceTable).toHaveBeenCalledWith(tx, 'session-1');
    expect(validateEvaluationRules).toHaveBeenCalled();
    expect(freezeSessionConfig).toHaveBeenCalledWith(tx, 'session-1', 'student-1');
    expect(tx.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluations'), [
      'student-1',
      'student-2',
      'problem-1',
      'session-1',
      'table-1',
    ]);
    expect(tx.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE evaluations'),
      expect.anything(),
    );
  });

  it('rejects attempts to edit an already submitted peer evaluation', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'evaluation-1', status: EvaluationStatus.SUBMITTED }]),
    };
    const transaction = jest.fn((work: (manager: typeof tx) => unknown) => work(tx));
    jest.mocked(findPeerOrThrow).mockResolvedValue({ id: 'student-2', name: 'Bia', papel: null });

    await expect(recordPeerEvaluation({ transaction } as never, input as never)).rejects.toThrow(
      'A avaliação deste colega já foi enviada e não pode ser alterada.',
    );
    expect(freezeSessionConfig).not.toHaveBeenCalled();
  });
});
