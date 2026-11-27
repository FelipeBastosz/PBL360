import type { EntityManager } from 'typeorm';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';
import {
  readHistoryConfig,
  readParticipatingStatus,
  readParticipatingStudents,
  readPeerItemRows,
  readReceivedPeerEvaluations,
  readSessionAdjustments,
  readSessionPeerAdjustments,
  readSessionPeerEvaluations,
  readSessionSelfEvaluations,
  readSessionTiming,
  readSessionTutorScores,
  readStudentParticipant,
  readStudentPeerAdjustments,
  readStudentSelfAdjustments,
  readStudentSelfEvaluation,
  readStudentTutorScores,
} from './evaluation-history.reads';

jest.mock('./session-evaluation-config.persistence', () => ({
  readSessionConfig: jest.fn(),
  readSessionTableConfig: jest.fn(),
}));

describe('evaluation-history reads', () => {
  const query = jest.fn();
  const manager = { query } as unknown as EntityManager;

  beforeEach(() => {
    jest.clearAllMocks();
    query.mockResolvedValue([]);
  });

  it('reads participation status and defaults to false when no row exists', async () => {
    query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([]);
    await expect(readParticipatingStatus(manager, 'session-1', 'student-1')).resolves.toBe(true);
    await expect(readParticipatingStatus(manager, 'session-1', 'student-2')).resolves.toBe(false);
  });

  it('delegates history configuration to snapshot then table configuration', async () => {
    const snapshot = { frozen: true };
    const table = { frozen: false };
    jest
      .mocked(readSessionConfig)
      .mockResolvedValueOnce(snapshot as never)
      .mockResolvedValueOnce(null);
    jest.mocked(readSessionTableConfig).mockResolvedValue(table as never);

    await expect(readHistoryConfig(manager, 'session-1')).resolves.toBe(snapshot);
    await expect(readHistoryConfig(manager, 'session-2')).resolves.toBe(table);
    expect(readSessionTableConfig).toHaveBeenCalledTimes(1);
  });

  it('forwards session and student query results', async () => {
    const row = { alunoId: 'student-1' };
    query.mockResolvedValue([row]);
    await expect(readParticipatingStudents(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readSessionSelfEvaluations(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readSessionAdjustments(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readSessionPeerAdjustments(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readSessionPeerEvaluations(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readSessionTutorScores(manager, 'session-1')).resolves.toEqual([row]);
    await expect(readStudentSelfAdjustments(manager, 'evaluation-1')).resolves.toEqual([row]);
    await expect(readStudentPeerAdjustments(manager, 'session-1', 'student-1')).resolves.toEqual([
      row,
    ]);
    await expect(readStudentTutorScores(manager, 'session-1', 'student-1')).resolves.toEqual([row]);
    await expect(readReceivedPeerEvaluations(manager, 'session-1', 'student-1')).resolves.toEqual([
      row,
    ]);
  });

  it('returns the first matching row or null for optional participant, timing and self data', async () => {
    const participant = { alunoId: 'student-1' };
    const timing = { selfEvalReleased: false, selfEvalDeadline: null };
    const evaluation = { id: 'evaluation-1' };
    query
      .mockResolvedValueOnce([participant])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([timing])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([evaluation])
      .mockResolvedValueOnce([]);

    await expect(readStudentParticipant(manager, 'session-1', 'student-1')).resolves.toBe(
      participant,
    );
    await expect(readStudentParticipant(manager, 'session-1', 'student-2')).resolves.toBeNull();
    await expect(readSessionTiming(manager, 'session-1')).resolves.toBe(timing);
    await expect(readSessionTiming(manager, 'session-2')).resolves.toBeNull();
    await expect(readStudentSelfEvaluation(manager, 'session-1', 'student-1')).resolves.toBe(
      evaluation,
    );
    await expect(readStudentSelfEvaluation(manager, 'session-1', 'student-2')).resolves.toBeNull();
  });

  it('skips empty peer item reads and groups returned criterion scores by evaluation', async () => {
    await expect(readPeerItemRows(manager, [])).resolves.toEqual(new Map());
    expect(query).not.toHaveBeenCalled();

    query.mockResolvedValueOnce([
      { evaluationId: 'peer-1', criterionId: 'c-1', score: 8 },
      { evaluationId: 'peer-1', criterionId: 'c-2', score: 9 },
      { evaluationId: 'peer-2', criterionId: 'c-1', score: 7 },
    ]);
    await expect(readPeerItemRows(manager, ['peer-1', 'peer-2'])).resolves.toEqual(
      new Map([
        [
          'peer-1',
          [
            { criterionId: 'c-1', score: 8 },
            { criterionId: 'c-2', score: 9 },
          ],
        ],
        ['peer-2', [{ criterionId: 'c-1', score: 7 }]],
      ]),
    );
  });
});
