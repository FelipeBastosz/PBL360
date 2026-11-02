import { toReceivedProblem, type ReceivedFeedbackRow } from './received-feedback-row.mapper';
import type { ReceivedFeedbackGrades } from './received-feedback-grades.reads';

describe('Received feedback grade mapping', () => {
  const base: ReceivedFeedbackRow = {
    id: 'individual',
    authorId: 'tutor',
    authorName: 'Professor',
    text: 'Texto',
    createdAt: new Date(),
    editedAt: null,
    scope: 'ALUNO',
    sessionId: null,
    roomId: 'room',
    problemId: 'problem',
    score: '9.50',
  };
  const rows: ReceivedFeedbackRow[] = [
    base,
    { ...base, id: 'general', scope: 'PROBLEMA', score: '10' },
    { ...base, id: 'session-feedback', scope: 'SESSAO', sessionId: 'session', score: '10' },
  ];
  const sessions = [{ sessionId: 'session', label: 'Sessão', date: '2026-10-01' }];
  const grades: ReceivedFeedbackGrades = {
    released: true,
    finalScore: 7.5,
    sessions: new Map([['session', 8.5]]),
  };

  it('hides every grade when the tutor has not submitted an evaluation', () => {
    const result = toReceivedProblem(rows, sessions, new Set(), {
      released: false,
      finalScore: null,
      sessions: new Map(),
    });
    expect(result.finalScore).toBeNull();
    expect(result.individual?.score).toBeNull();
    expect(result.general?.score).toBeNull();
    expect(result.sessions[0]?.feedback?.score).toBeNull();
    expect(result.individual?.text).toBe('Texto');
  });

  it('associates the final grade with general feedback and the calculated grade with session feedback', () => {
    const result = toReceivedProblem(rows, sessions, new Set(['general']), grades);
    expect(result.finalScore).toBe(7.5);
    expect(result.general).toMatchObject({ score: 7.5, isNew: true });
    expect(result.individual?.score).toBe(9.5);
    expect(result.sessions[0]?.feedback?.score).toBe(8.5);
  });

  it('preserves zero without replacing it with null', () => {
    const result = toReceivedProblem(
      [{ ...base, score: '0' }, rows[1]!, rows[2]!],
      sessions,
      new Set(),
      { released: true, finalScore: 0, sessions: new Map([['session', 0]]) },
    );
    expect(result.finalScore).toBe(0);
    expect(result.individual?.score).toBe(0);
    expect(result.general?.score).toBe(0);
    expect(result.sessions[0]?.feedback?.score).toBe(0);
  });

  it('does not borrow a grade from another session or invent missing feedbacks', () => {
    const result = toReceivedProblem([rows[2]!], sessions, new Set(), {
      ...grades,
      sessions: new Map([['other-session', 10]]),
    });
    expect(result.individual).toBeNull();
    expect(result.general).toBeNull();
    expect(result.sessions[0]?.feedback?.score).toBeNull();
  });
});
