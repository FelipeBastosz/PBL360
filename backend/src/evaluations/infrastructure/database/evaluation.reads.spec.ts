import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { readEvaluation, readEvaluationDetail } from './evaluation.reads';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';

jest.mock('./session-evaluation-config.persistence', () => ({
  readSessionConfig: jest.fn(),
  readSessionTableConfig: jest.fn(),
}));

describe('evaluation reads', () => {
  it('returns null when evaluation is missing and maps numeric items when present', async () => {
    const row = {
      id: 'evaluation-1',
      status: EvaluationStatus.SUBMITTED,
      submittedAt: new Date(),
      sessionScore: '8.5',
      appliedBonus: '7',
      calculationVersion: 'v1',
      createdBy: 'teacher',
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: new Date(),
    };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce([
          { id: 'item-1', evaluationId: 'evaluation-1', criterionId: 'c1', score: '9.5' },
        ]),
    } as unknown as EntityManager;

    await expect(readEvaluation(manager, 'session-1', 'student-1')).resolves.toBeNull();
    await expect(readEvaluation(manager, 'session-1', 'student-1')).resolves.toMatchObject({
      id: 'evaluation-1',
      sessionScore: 8.5,
      appliedBonus: 7,
      items: [{ id: 'item-1', score: 9.5 }],
    });
    expect(manager.query).toHaveBeenCalledTimes(3);
  });

  it('returns configured evaluation details and maps adjustments and role score', async () => {
    const config = {
      tableId: 'table-1',
      tableName: 'Padrão',
      criteria: [
        { id: 'criterion-1', name: 'Critério', description: '', weight: 10, orderIndex: 0 },
      ],
      frozen: false,
    };
    const evaluation = {
      id: 'evaluation-1',
      status: EvaluationStatus.SUBMITTED,
      submittedAt: new Date(),
      sessionScore: 8,
      appliedBonus: null,
      calculationVersion: null,
      createdBy: 'teacher',
      createdAt: new Date(),
      updatedBy: null,
      updatedAt: new Date(),
      items: [],
    };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'evaluation-1',
            status: EvaluationStatus.SUBMITTED,
            submittedAt: evaluation.submittedAt,
            sessionScore: '8',
            appliedBonus: null,
            calculationVersion: null,
            createdBy: 'teacher',
            createdAt: evaluation.createdAt,
            updatedBy: null,
            updatedAt: evaluation.updatedAt,
          },
        ])
        .mockResolvedValueOnce([
          { id: 'item-1', evaluationId: 'evaluation-1', criterionId: 'criterion-1', score: '8' },
        ])
        .mockResolvedValueOnce([{ reason: 'Revisão', previousValue: '7', newValue: '8' }])
        .mockResolvedValueOnce([{ role: 'Facilitador', role_score: '9.5' }]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(config);

    await expect(
      readEvaluationDetail(
        manager,
        { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
        'student-1',
      ),
    ).resolves.toMatchObject({
      config,
      evaluation: { id: 'evaluation-1' },
      adjustments: [{ reason: 'Revisão', previousValue: 7, newValue: 8 }],
      papel: 'Facilitador',
      roleScore: 9.5,
    });
    expect(readSessionConfig).toHaveBeenCalledWith(manager, 'session-1');
    expect(readSessionTableConfig).not.toHaveBeenCalled();
  });

  it('uses table config when no frozen config exists and returns empty evaluation metadata', async () => {
    const config = { tableId: 'table-1', tableName: 'Padrão', criteria: [], frozen: false };
    const manager = {
      query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(null);
    jest.mocked(readSessionTableConfig).mockResolvedValue(config);

    await expect(
      readEvaluationDetail(
        manager,
        { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
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
