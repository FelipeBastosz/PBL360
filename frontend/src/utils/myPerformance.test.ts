import { describe, expect, it } from 'vitest';
import type { ReceivedProblemFeedbacksResponse, ReceivedSessionFeedback } from '@/types/feedback';
import { sortChronologically, toMyPerformanceSessions } from './myPerformance';

const feedback = (nota: number | null) => ({
  id: 'f1',
  autor: { id: 't1', nome: 'Prof. Carlos' },
  texto: 'Boa condução do grupo.',
  criadoEm: '2026-02-03T10:00:00.000Z',
  editadoEm: null,
  novo: false,
  nota,
});

const response = (sessoes: ReceivedSessionFeedback[]): ReceivedProblemFeedbacksResponse => ({
  notaFinal: null,
  individual: null,
  geral: null,
  sessoes,
});

const problem = { id: 'p1', titulo: 'Problema 1' };

describe('toMyPerformanceSessions', () => {
  it('uses the tutor grade sent with the feedback', () => {
    const [session] = toMyPerformanceSessions({
      problem,
      response: response([
        { sessaoId: 's1', rotulo: 'Abertura', data: '03-02-2026', feedback: feedback(8) },
      ]),
    });

    expect(session).toMatchObject({
      problemaId: 'p1',
      problemaTitulo: 'Problema 1',
      nota: 8,
      modalidade: null,
      feedback: 'Boa condução do grupo.',
      feedbackAuthor: 'Prof. Carlos',
    });
  });

  it('uses the session grade of self and peer assessment sessions, zero included', () => {
    const [session] = toMyPerformanceSessions({
      problem,
      response: response([
        {
          sessaoId: 's1',
          rotulo: 'Fechamento',
          data: '10-02-2026',
          feedback: null,
          nota: 0,
          avaliacoes: { modalidade: 'PARES', autoavaliacao: null, pares: null },
        },
      ]),
    });

    expect(session.nota).toBe(0);
    expect(session.modalidade).toBe('PARES');
  });

  it('keeps an unreleased grade as null', () => {
    const [session] = toMyPerformanceSessions({
      problem,
      response: response([
        { sessaoId: 's1', rotulo: 'Abertura', data: '03-02-2026', feedback: null },
      ]),
    });

    expect(session.nota).toBeNull();
  });
});

describe('sortChronologically', () => {
  it('orders by date, then by problem, then by the API order', () => {
    const at = (id: string, data: string, problemaId: string) => ({
      sessaoId: id,
      problemaId,
      problemaTitulo: problemaId,
      rotulo: id,
      data,
      nota: null,
      modalidade: null,
      feedback: null,
      feedbackAuthor: null,
    });

    const sorted = sortChronologically([
      [at('a', '10-02-2026', 'p1'), at('b', '10-02-2026', 'p1')],
      [at('c', '03-02-2026', 'p2'), at('d', '10-02-2026', 'p2')],
    ]);

    expect(sorted.map((session) => session.sessaoId)).toEqual(['c', 'a', 'b', 'd']);
  });
});
