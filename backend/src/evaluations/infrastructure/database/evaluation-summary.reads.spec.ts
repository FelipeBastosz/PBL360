import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { readEvaluationSummaries } from './evaluation-summary.reads';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';

jest.mock('./session-evaluation-config.persistence', () => ({
  readSessionConfig: jest.fn(),
  readSessionTableConfig: jest.fn(),
}));

describe('readEvaluationSummaries', () => {
  const context = { roomId: 'room-1', sessionId: 'session-1' };

  it('returns empty summaries without querying configuration when no grade is released', async () => {
    const rows = [
      {
        studentId: 'student-1',
        name: 'Ana',
        status: EvaluationStatus.DRAFT,
        evaluationId: 'e1',
        appliedBonus: null,
      },
      { studentId: 'student-2', name: 'Bia', status: null, evaluationId: null, appliedBonus: null },
    ];
    const manager = { query: jest.fn().mockResolvedValue(rows) } as unknown as EntityManager;

    await expect(readEvaluationSummaries(manager, context)).resolves.toEqual([
      { studentId: 'student-1', name: 'Ana', status: EvaluationStatus.DRAFT, sessionScore: null },
      { studentId: 'student-2', name: 'Bia', status: null, sessionScore: null },
    ]);
    expect(manager.query).toHaveBeenCalledTimes(1);
    expect(readSessionConfig).not.toHaveBeenCalled();
  });

  it('uses frozen config when available, uses adjusted values and calculates submitted scores', async () => {
    const rows = [
      {
        studentId: 'student-1',
        name: 'Ana',
        status: EvaluationStatus.SUBMITTED,
        evaluationId: 'e1',
        appliedBonus: '8',
      },
      {
        studentId: 'student-2',
        name: 'Bia',
        status: EvaluationStatus.DRAFT,
        evaluationId: 'e2',
        appliedBonus: null,
        adjustedScore: '7.25',
      },
      {
        studentId: 'student-3',
        name: 'Caio',
        status: EvaluationStatus.DRAFT,
        evaluationId: 'e3',
        appliedBonus: null,
        adjustedScore: null,
      },
    ];
    const config = {
      tableId: 'table-1',
      tableName: 'Padrão',
      criteria: [
        { id: 'criterion-1', name: 'Critério', description: '', weight: 10, orderIndex: 0 },
      ],
      frozen: true,
      formula: { criteriaWeight: 70, roleWeight: 30 },
    };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce(rows)
        .mockResolvedValueOnce([{ evaluationId: 'e1', criterionId: 'criterion-1', score: '9' }]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(config);

    await expect(readEvaluationSummaries(manager, context)).resolves.toEqual([
      {
        studentId: 'student-1',
        name: 'Ana',
        status: EvaluationStatus.SUBMITTED,
        sessionScore: 8.7,
      },
      {
        studentId: 'student-2',
        name: 'Bia',
        status: EvaluationStatus.SUBMITTED,
        sessionScore: 7.25,
      },
      { studentId: 'student-3', name: 'Caio', status: EvaluationStatus.DRAFT, sessionScore: null },
    ]);
    expect(readSessionConfig).toHaveBeenCalledWith(manager, 'session-1');
    expect(readSessionTableConfig).not.toHaveBeenCalled();
    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('falls back to the session table configuration', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            studentId: 'student-1',
            name: 'Ana',
            status: EvaluationStatus.SUBMITTED,
            evaluationId: 'e1',
            appliedBonus: null,
          },
        ])
        .mockResolvedValueOnce([{ evaluationId: 'e1', criterionId: 'c1', score: '6' }]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(null);
    jest.mocked(readSessionTableConfig).mockResolvedValue({
      tableId: 'table-1',
      tableName: 'Padrão',
      criteria: [{ id: 'c1', name: 'C1', description: '', weight: 10, orderIndex: 0 }],
      frozen: false,
    });

    await expect(readEvaluationSummaries(manager, context)).resolves.toMatchObject([
      { studentId: 'student-1', sessionScore: 6 },
    ]);
    expect(readSessionTableConfig).toHaveBeenCalledWith(manager, 'session-1');
  });
});
