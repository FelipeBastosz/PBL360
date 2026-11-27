import {
  getPeerEvaluation,
  isStudentParticipating,
  listSessionPeers,
} from './peer-evaluation.reads';
import { recordPeerEvaluation } from './peer-evaluation.persistence';
import { readEvaluationSummaries } from './evaluation-summary.reads';
import { readProblemConfig, readFormula } from './session-evaluation-config.persistence';
import { readEvaluationDetail } from './evaluation.reads';
import { recordEvaluation } from './evaluation.persistence';
import { getStudentEvaluationSummary, readSelfAssessmentDetail } from './self-assessment.reads';
import { recordSelfAssessment } from './self-assessment.persistence';
import { PgEvaluationRepository } from './pg-evaluation.repository';

jest.mock('./peer-evaluation.reads', () => ({
  getPeerEvaluation: jest.fn(),
  isStudentParticipating: jest.fn(),
  listSessionPeers: jest.fn(),
}));
jest.mock('./peer-evaluation.persistence', () => ({ recordPeerEvaluation: jest.fn() }));
jest.mock('./evaluation-summary.reads', () => ({ readEvaluationSummaries: jest.fn() }));
jest.mock('./session-evaluation-config.persistence', () => ({
  readProblemConfig: jest.fn(),
  readFormula: jest.fn(),
}));
jest.mock('./evaluation.reads', () => ({ readEvaluationDetail: jest.fn() }));
jest.mock('./evaluation.persistence', () => ({ recordEvaluation: jest.fn() }));
jest.mock('./self-assessment.reads', () => ({
  getStudentEvaluationSummary: jest.fn(),
  readSelfAssessmentDetail: jest.fn(),
}));
jest.mock('./self-assessment.persistence', () => ({ recordSelfAssessment: jest.fn() }));

describe('PgEvaluationRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates reads and writes to query helpers with the correct manager', async () => {
    const manager = { query: jest.fn() };
    const transaction = jest.fn((...args: unknown[]) => {
      const callback = args.at(-1) as (value: typeof manager) => unknown;
      return callback(manager);
    });
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([]);
    const dataSource = { transaction, query, manager };
    const repository = new PgEvaluationRepository(dataSource as never);
    const context = { roomId: 'room-1', problemId: 'problem-1', sessionId: 'session-1' };
    const input = { context, authorId: 'teacher-1', studentId: 'student-1' };

    jest.mocked(readProblemConfig).mockResolvedValue({} as never);
    jest.mocked(readEvaluationSummaries).mockResolvedValue([]);
    jest.mocked(readEvaluationDetail).mockResolvedValue({} as never);
    jest.mocked(recordEvaluation).mockResolvedValue({} as never);
    jest.mocked(isStudentParticipating).mockResolvedValue(true);
    jest.mocked(readFormula).mockResolvedValue({ criteriaWeight: 70, roleWeight: 30 });
    jest.mocked(listSessionPeers).mockResolvedValue([]);
    jest.mocked(getPeerEvaluation).mockResolvedValue({} as never);
    jest.mocked(recordPeerEvaluation).mockResolvedValue({} as never);
    jest.mocked(readSelfAssessmentDetail).mockResolvedValue({} as never);
    jest.mocked(getStudentEvaluationSummary).mockResolvedValue({} as never);
    jest.mocked(recordSelfAssessment).mockResolvedValue({} as never);

    await repository.getProblemCriteria('problem-1');
    await expect(repository.isEnrolled('room-1', 'student-1')).resolves.toBe(true);
    await expect(repository.hasActivePoker('session-1')).resolves.toBe(false);
    await repository.list(context);
    await repository.get(context, 'student-1');
    await repository.recordEvaluation(input as never);
    await repository.isStudentParticipating('session-1', 'student-1');
    await repository.getSessionFormula('session-1');
    await repository.listSessionPeers('session-1', 'teacher-1');
    await repository.getPeerEvaluation(context, 'teacher-1', 'student-1');
    await repository.recordPeerEvaluation(input as never);
    await repository.getSelfAssessment(context, 'student-1');
    await repository.getStudentEvaluationSummary(context, 'student-1');
    await repository.recordSelfAssessment(input as never);

    expect(readProblemConfig).toHaveBeenCalledWith(manager, 'problem-1');
    expect(readEvaluationSummaries).toHaveBeenCalledWith(manager, context);
    expect(readEvaluationDetail).toHaveBeenCalledWith(manager, context, 'student-1');
    expect(recordEvaluation).toHaveBeenCalledWith(manager, input);
    expect(isStudentParticipating).toHaveBeenCalledWith(manager, 'session-1', 'student-1');
    expect(readFormula).toHaveBeenCalledWith(manager, 'session-1');
    expect(listSessionPeers).toHaveBeenCalledWith(manager, 'session-1', 'teacher-1');
    expect(getPeerEvaluation).toHaveBeenCalledWith(manager, context, 'teacher-1', 'student-1');
    expect(recordPeerEvaluation).toHaveBeenCalledWith(manager, input);
    expect(readSelfAssessmentDetail).toHaveBeenCalledWith(manager, context, 'student-1');
    expect(getStudentEvaluationSummary).toHaveBeenCalledWith(manager, 'session-1', 'student-1');
    expect(recordSelfAssessment).toHaveBeenCalledWith(manager, input);
    expect(transaction).toHaveBeenCalledTimes(6);
  });

  it('returns false when enrollment query has no row', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(),
      manager: { query: jest.fn() },
    };
    const repository = new PgEvaluationRepository(dataSource as never);

    await expect(repository.isEnrolled('room-1', 'student-1')).resolves.toBe(false);
    await expect(repository.hasActivePoker('session-1')).resolves.toBe(false);
  });
});
