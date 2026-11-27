import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import { SessionGradeCalculator } from '../../domain/services/session-grade-calculator';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type { PeerEvaluationWrite } from '../../domain/repositories/evaluation.repository';
import { freezeSessionConfig } from './session-evaluation-config.persistence';
import { findPeerOrThrow } from './peer-evaluation.reads';
import {
  FIND_PEER_EVALUATION,
  FIND_PEER_ITEMS,
  INSERT_INITIAL_PEER_EVALUATION,
  UPDATE_PEER_DRAFT,
  UPDATE_PEER_SUBMISSION,
} from './peer-evaluation.queries';
import { recordPeerEvaluation } from './peer-evaluation.persistence';
import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { toEvaluation } from './evaluation-row.mapper';

jest.mock('@/sessions/infrastructure/database/session-table-lock.persistence', () => ({
  lockSessionPerformanceTable: jest.fn(),
}));
jest.mock('./session-evaluation-config.persistence', () => ({ freezeSessionConfig: jest.fn() }));
jest.mock('./peer-evaluation.reads', () => ({ findPeerOrThrow: jest.fn() }));
jest.mock('./evaluation-row.mapper', () => ({ toEvaluation: jest.fn() }));
jest.mock('../../domain/services/session-grade-calculator', () => ({
  SessionGradeCalculator: { calculate: jest.fn() },
  SESSION_CALCULATION_VERSION: 'TEST_CALCULATION_VERSION',
}));

const config = {
  tableId: 'table-1',
  tableName: 'Tabela',
  criteria: [{ id: 'criterion-1', name: 'Critério', weight: 100, orderIndex: 1 }],
  frozen: true,
  formula: { criteriaWeight: 70, roleWeight: 30 },
} as SessionEvaluationConfig;

const baseInput: PeerEvaluationWrite = {
  sessionId: 'session-1',
  problemId: 'problem-1',
  evaluatorId: 'student-1',
  peerId: 'student-2',
  items: [{ criterionId: 'criterion-1', score: 8 }],
  submit: false,
};

const peer = { id: 'student-2', name: 'Bia', papel: 'Facilitadora' };
const updatedEvaluation = { id: 'evaluation-1', status: EvaluationStatus.DRAFT };

interface ManagerOptions {
  existing?: { id: string; status: EvaluationStatus } | null;
  inserted?: { id: string }[];
  fallback?: { id: string }[];
}

function createManager(options: ManagerOptions = {}) {
  const query = jest.fn((sql: string) => {
    if (sql === FIND_PEER_EVALUATION) return Promise.resolve([{}]);
    if (sql === FIND_PEER_ITEMS) return Promise.resolve([]);
    if (sql.includes('SELECT id, status FROM evaluations')) {
      return Promise.resolve(options.existing ? [options.existing] : []);
    }
    if (sql === INSERT_INITIAL_PEER_EVALUATION)
      return Promise.resolve(options.inserted ?? [{ id: 'evaluation-1' }]);
    if (sql.includes('SELECT id FROM evaluations')) return Promise.resolve(options.fallback ?? []);
    return Promise.resolve([]);
  });
  const tx = { query };
  const manager = {
    transaction: jest.fn((work: (transaction: EntityManager) => Promise<unknown>) =>
      work(tx as unknown as EntityManager),
    ),
  } as unknown as EntityManager;
  return { manager, query };
}

describe('recordPeerEvaluation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(findPeerOrThrow).mockResolvedValue(peer);
    jest.mocked(freezeSessionConfig).mockResolvedValue(config);
    jest.mocked(lockSessionPerformanceTable).mockResolvedValue('table-1');
    jest.mocked(SessionGradeCalculator.calculate).mockReturnValue(8.5);
    jest.mocked(toEvaluation).mockReturnValue(updatedEvaluation as never);
  });

  it('creates a draft evaluation, saves items and returns the updated peer detail', async () => {
    const { manager, query } = createManager();

    await expect(recordPeerEvaluation(manager, baseInput)).resolves.toEqual({
      peer,
      config,
      evaluation: updatedEvaluation,
    });
    expect(lockSessionPerformanceTable).toHaveBeenCalledWith(expect.anything(), 'session-1');
    expect(findPeerOrThrow).toHaveBeenCalledWith(
      expect.anything(),
      'session-1',
      'student-1',
      'student-2',
    );
    expect(query).toHaveBeenCalledWith(UPDATE_PEER_DRAFT, [
      null,
      'student-1',
      expect.any(Date),
      'evaluation-1',
    ]);
    expect(query).toHaveBeenCalledWith('DELETE FROM evaluation_items WHERE evaluation_id = $1;', [
      'evaluation-1',
    ]);
    expect(query).toHaveBeenCalledWith(
      'INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, $3);',
      ['evaluation-1', 'criterion-1', 8],
    );
    expect(toEvaluation).toHaveBeenCalledWith({}, []);
  });

  it('submits an existing draft and calculates the score without a role bonus', async () => {
    const { manager, query } = createManager({
      existing: { id: 'evaluation-existing', status: EvaluationStatus.DRAFT },
    });
    const input = { ...baseInput, submit: true };

    await recordPeerEvaluation(manager, input);

    expect(query).not.toHaveBeenCalledWith(INSERT_INITIAL_PEER_EVALUATION, expect.anything());
    expect(query).toHaveBeenCalledWith(UPDATE_PEER_SUBMISSION, [
      'student-1',
      expect.any(Date),
      8.5,
      null,
      'TEST_CALCULATION_VERSION',
      'evaluation-existing',
    ]);
    expect(SessionGradeCalculator.calculate).toHaveBeenCalledWith(
      input.items,
      config.criteria,
      null,
      false,
      config.formula,
    );
  });

  it('finds an evaluation created concurrently and submits with the supplied role bonus', async () => {
    const { manager, query } = createManager({
      inserted: [],
      fallback: [{ id: 'evaluation-race' }],
    });
    const input = { ...baseInput, submit: true, notaCargo: 9 };

    await recordPeerEvaluation(manager, input);

    expect(query).toHaveBeenCalledWith(INSERT_INITIAL_PEER_EVALUATION, [
      'student-1',
      'student-2',
      'problem-1',
      'session-1',
      'table-1',
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM evaluations'), [
      'session-1',
      'student-1',
      'student-2',
    ]);
    expect(SessionGradeCalculator.calculate).toHaveBeenCalledWith(
      input.items,
      config.criteria,
      9,
      true,
      config.formula,
    );
  });

  it('rejects changes to an evaluation that was already submitted', async () => {
    const { manager, query } = createManager({
      existing: { id: 'evaluation-existing', status: EvaluationStatus.SUBMITTED },
    });

    await expect(recordPeerEvaluation(manager, baseInput)).rejects.toBeInstanceOf(ConflictError);
    expect(freezeSessionConfig).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalledWith(INSERT_INITIAL_PEER_EVALUATION, expect.anything());
  });
});
