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
      finalScore: 9,
      individual: { ...feedback, score: 0 },
      general: feedback,
      sessions: [{ sessionId: 'session', label: 'Sessão', date: '2026-10-01', feedback }],
    });
    expect(result.individual?.nota).toBe(0);
    expect(result.notaFinal).toBe(9);
    expect(result.geral?.nota).toBe(9);
    expect(result.feedbacks.map(({ tipo, nota }) => ({ tipo, nota }))).toEqual([
      { tipo: 'INDIVIDUAL', nota: 0 },
      { tipo: 'GERAL', nota: 9 },
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
        individual: null,
        general: null,
        sessions: [],
      }),
    ).toEqual({
      notaFinal: null,
      feedbacks: [],
      individual: null,
      geral: null,
      sessoes: [],
    });
  });
});
