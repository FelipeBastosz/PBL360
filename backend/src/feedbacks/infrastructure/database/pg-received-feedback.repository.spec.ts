import { readReceivedFeedbackGrades } from './received-feedback-grades.reads';
import { PgReceivedFeedbackRepository } from './pg-received-feedback.repository';

jest.mock('./received-feedback-grades.reads', () => ({
  readReceivedFeedbackGrades: jest.fn(),
}));

describe('PgReceivedFeedbackRepository', () => {
  const gradeResult = {
    released: true,
    finalScore: 8.5,
    sessions: new Map([['session-1', 9]]),
    components: new Map(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns null when no submitted session feedback exists', async () => {
    const managerQuery = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgReceivedFeedbackRepository({ transaction } as never);

    await expect(repository.readSession('session-1', 'student-1')).resolves.toBeNull();
    expect(managerQuery).toHaveBeenCalledTimes(1);
    expect(readReceivedFeedbackGrades).not.toHaveBeenCalled();
  });

  it('returns submitted session feedback and records its first view', async () => {
    const createdAt = new Date('2026-01-01T10:00:00Z');
    const row = {
      id: 'feedback-1',
      authorId: 'teacher-1',
      authorName: 'Docente',
      text: 'Bom trabalho',
      createdAt,
      editedAt: null,
      scope: 'SESSAO' as const,
      sessionId: 'session-1',
      problemId: 'problem-1',
      roomId: 'room-1',
      score: '7',
    };
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ id: 'feedback-1' }])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    jest.mocked(readReceivedFeedbackGrades).mockResolvedValue(gradeResult);
    const repository = new PgReceivedFeedbackRepository({ transaction } as never);

    await expect(repository.readSession('session-1', 'student-1')).resolves.toEqual({
      id: 'feedback-1',
      author: { id: 'teacher-1', name: 'Docente' },
      text: 'Bom trabalho',
      createdAt,
      editedAt: null,
      isNew: true,
      score: 9,
    });
    expect(readReceivedFeedbackGrades).toHaveBeenCalledWith(
      expect.anything(),
      'room-1',
      'problem-1',
      'student-1',
    );
    expect(managerQuery).toHaveBeenCalledTimes(3);
    expect(managerQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
      ['feedback-1'],
      'student-1',
    ]);
  });

  it('reads problem feedback and records views only for visible feedbacks', async () => {
    const createdAt = new Date('2026-01-02T10:00:00Z');
    const rows = [
      {
        id: 'individual',
        authorId: 'teacher-1',
        authorName: 'Docente',
        text: 'Individual',
        createdAt,
        editedAt: null,
        scope: 'ALUNO' as const,
        sessionId: null,
        problemId: 'problem-1',
        roomId: 'room-1',
        score: '6',
      },
      {
        id: 'general',
        authorId: 'teacher-1',
        authorName: 'Docente',
        text: 'Geral',
        createdAt,
        editedAt: null,
        scope: 'PROBLEMA' as const,
        sessionId: null,
        problemId: 'problem-1',
        roomId: 'room-1',
        score: null,
      },
      {
        id: 'session-feedback',
        authorId: 'teacher-1',
        authorName: 'Docente',
        text: 'Sessão',
        createdAt,
        editedAt: null,
        scope: 'SESSAO' as const,
        sessionId: 'session-1',
        problemId: 'problem-1',
        roomId: 'room-1',
        score: null,
      },
    ];
    const sessions = [{ sessionId: 'session-1', label: 'Sessão 1', date: '2026-01-01' }];
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce(sessions)
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ id: 'general' }, { id: 'session-feedback' }])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    jest.mocked(readReceivedFeedbackGrades).mockResolvedValue(gradeResult);
    const repository = new PgReceivedFeedbackRepository({ transaction } as never);

    await expect(repository.readProblem('problem-1', 'student-1', 'room-1')).resolves.toMatchObject(
      {
        finalScore: 8.5,
        individual: { id: 'individual', score: 6, isNew: false },
        general: { id: 'general', score: 8.5, isNew: true },
        sessions: [
          { sessionId: 'session-1', feedback: { id: 'session-feedback', score: 9, isNew: true } },
        ],
      },
    );
    expect(managerQuery).toHaveBeenCalledTimes(4);
    expect(managerQuery).toHaveBeenNthCalledWith(3, expect.any(String), [
      ['individual', 'general', 'session-feedback'],
      'student-1',
    ]);
    expect(readReceivedFeedbackGrades).toHaveBeenCalledWith(
      expect.anything(),
      'room-1',
      'problem-1',
      'student-1',
    );
  });

  it('skips persistence when the problem has no feedback views to record', async () => {
    const managerQuery = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    jest.mocked(readReceivedFeedbackGrades).mockResolvedValue({
      released: false,
      finalScore: null,
      sessions: new Map(),
      components: new Map(),
    });
    const repository = new PgReceivedFeedbackRepository({ transaction } as never);

    await expect(repository.readProblem('problem-1', 'student-1', 'room-1')).resolves.toEqual({
      finalScore: null,
      individual: null,
      general: null,
      sessions: [],
    });
    expect(managerQuery).toHaveBeenCalledTimes(2);
  });
});
