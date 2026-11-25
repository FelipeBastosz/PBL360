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

  it('exposes only the public feedback fields, without criterion scores', () => {
    expect(toReceivedFeedbackResponse(feedback)).toEqual({
      id: 'feedback',
      autor: { id: 'tutor', nome: 'Tutor' },
      texto: 'Texto',
      criadoEm: feedback.createdAt,
      editadoEm: null,
      novo: true,
      nota: 9,
    });
  });

  it('preserves associated scores and feedback types including zero', () => {
    const result = toReceivedProblemResponse({
      finalScore: 0,
      general: { ...feedback, score: 0 },
      sessions: [{ sessionId: 'session', label: 'Sessão', date: '2026-10-01', feedback }],
    });
    expect(result.notaFinal).toBe(0);
    expect(result.geral?.nota).toBe(0);
    expect(result.feedbacks.map(({ tipo, nota }) => ({ tipo, nota }))).toEqual([
      { tipo: 'GERAL', nota: 0 },
      { tipo: 'SESSAO', nota: 9 },
    ]);
    expect(result.sessoes[0]?.feedback?.nota).toBe(9);
    expect(result.sessoes[0]).toMatchObject({
      sessaoId: 'session',
      rotulo: 'Sessão',
      data: '01-10-2026',
    });
  });

  it('preserves unavailable feedback and an empty session list', () => {
    expect(
      toReceivedProblemResponse({
        finalScore: null,
        general: null,
        sessions: [],
      }),
    ).toEqual({
      notaFinal: null,
      feedbacks: [],
      geral: null,
      sessoes: [],
    });
  });
});
