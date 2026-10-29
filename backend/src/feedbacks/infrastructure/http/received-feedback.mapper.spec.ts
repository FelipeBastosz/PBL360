import { toReceivedFeedbackResponse, toReceivedProblemResponse } from './received-feedback.mapper';

describe('Received feedback responses', () => {
  const feedback = {
    id: 'feedback',
    author: { id: 'tutor', name: 'Tutor' },
    text: 'Texto',
    createdAt: new Date(),
    editedAt: null,
    isNew: true,
    score: 9,
    sessionScore: 10,
    items: [{ score: 10 }],
  };

  it('exposes only the public feedback fields, without evaluation scores', () => {
    expect(toReceivedFeedbackResponse(feedback)).toEqual({
      id: 'feedback',
      autor: { id: 'tutor', nome: 'Tutor' },
      texto: 'Texto',
      criadoEm: feedback.createdAt,
      editadoEm: null,
      novo: true,
    });
  });

  it('includes a zero score only on the individual problem feedback', () => {
    const result = toReceivedProblemResponse({
      individual: { ...feedback, score: 0 },
      general: feedback,
      sessions: [{ sessionId: 'session', label: 'Sessão', date: '2026-10-01', feedback }],
    });
    expect(result.individual?.nota).toBe(0);
    expect(result.geral).not.toHaveProperty('nota');
    expect(result.sessoes[0]?.feedback).not.toHaveProperty('nota');
    expect(result.sessoes[0]).toMatchObject({
      sessaoId: 'session',
      rotulo: 'Sessão',
      data: '01-10-2026',
    });
  });

  it('preserves unavailable feedback and an empty session list', () => {
    expect(toReceivedProblemResponse({ individual: null, general: null, sessions: [] })).toEqual({
      individual: null,
      geral: null,
      sessoes: [],
    });
  });
});
