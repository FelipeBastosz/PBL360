import type { EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { readSubmittedConfig } from './submitted-student-config.reads';
import { readSessionConfig, readSessionTableConfig } from './session-evaluation-config.persistence';
import {
  getPeerEvaluation,
  isStudentParticipating,
  listSessionPeers,
  findPeerOrThrow,
} from './peer-evaluation.reads';

jest.mock('./submitted-student-config.reads', () => ({ readSubmittedConfig: jest.fn() }));
jest.mock('./session-evaluation-config.persistence', () => ({
  readSessionConfig: jest.fn(),
  readSessionTableConfig: jest.fn(),
}));

describe('peer evaluation reads', () => {
  it('checks participation and lists peers only for participating students', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'student-1' }])
        .mockResolvedValueOnce([
          { alunoId: 'student-2', nome: 'Bia', status: EvaluationStatus.SUBMITTED, papel: null },
        ]),
    } as unknown as EntityManager;

    await expect(isStudentParticipating(manager, 'session-1', 'student-1')).resolves.toBe(false);
    await expect(listSessionPeers(manager, 'session-1', 'student-1')).resolves.toEqual([
      { alunoId: 'student-2', nome: 'Bia', status: EvaluationStatus.SUBMITTED, papel: null },
    ]);
    expect(manager.query).toHaveBeenCalledTimes(3);

    const absent = { query: jest.fn().mockResolvedValue([]) } as unknown as EntityManager;
    await expect(listSessionPeers(absent, 'session-1', 'student-1')).resolves.toEqual([]);
    expect(absent.query).toHaveBeenCalledTimes(1);
  });

  it('rejects self evaluation and non-participant peers, and normalizes missing role', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'peer-1', name: 'Ana' }]),
    } as unknown as EntityManager;

    await expect(findPeerOrThrow(manager, 'session-1', 'student-1', 'student-1')).rejects.toThrow(
      'Um aluno não pode avaliar a si mesmo como par.',
    );
    await expect(findPeerOrThrow(manager, 'session-1', 'student-1', 'missing')).rejects.toThrow(
      'O colega não participou da sessão.',
    );
    await expect(findPeerOrThrow(manager, 'session-1', 'student-1', 'peer-1')).resolves.toEqual({
      id: 'peer-1',
      name: 'Ana',
      papel: null,
    });
  });

  it('loads and recalculates peer evaluation using frozen or current configuration', async () => {
    const config = { tableId: 'table-1', tableName: 'Atual', criteria: [], frozen: true };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'peer-1', name: 'Ana', papel: 'Facilitador' }])
        .mockResolvedValueOnce([]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(config);
    jest.mocked(readSubmittedConfig).mockResolvedValue(config);

    await expect(
      getPeerEvaluation(
        manager,
        { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
        'student-1',
        'peer-1',
      ),
    ).resolves.toMatchObject({
      peer: { id: 'peer-1', papel: 'Facilitador' },
      config,
      evaluation: null,
    });
    expect(readSessionTableConfig).not.toHaveBeenCalled();
    expect(readSubmittedConfig).toHaveBeenCalledWith(manager, 'session-1', null, config);
  });

  it('uses table configuration when no frozen configuration exists', async () => {
    const config = { tableId: 'table-1', tableName: 'Atual', criteria: [], frozen: false };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'peer-1', name: 'Ana', papel: null }])
        .mockResolvedValueOnce([]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(null);
    jest.mocked(readSessionTableConfig).mockResolvedValue(config);
    jest.mocked(readSubmittedConfig).mockResolvedValue(config);

    await getPeerEvaluation(
      manager,
      { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
      'student-1',
      'peer-1',
    );
    expect(readSessionTableConfig).toHaveBeenCalledWith(manager, 'session-1');
  });

  it('loads an existing peer evaluation and its items when present', async () => {
    const config = { tableId: 'table-1', tableName: 'Atual', criteria: [], frozen: true };
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'peer-1', name: 'Ana', papel: null }])
        .mockResolvedValueOnce([
          {
            id: 'eval-1',
            authorId: 'student-1',
            studentId: 'peer-1',
            problemId: 'problem-1',
            sessionId: 'session-1',
            type: 'PEER_ASSESSMENT',
            status: EvaluationStatus.DRAFT,
            performanceTableId: 'table-1',
            sessionScore: null,
            appliedBonus: null,
            submittedAt: null,
            updatedAt: new Date('2026-01-01T00:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([]),
    } as unknown as EntityManager;
    jest.mocked(readSessionConfig).mockResolvedValue(config);
    jest.mocked(readSubmittedConfig).mockResolvedValue(config);

    const result = await getPeerEvaluation(
      manager,
      { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' },
      'student-1',
      'peer-1',
    );
    expect(result.evaluation?.id).toBe('eval-1');
  });
});
