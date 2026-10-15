import {
  toAdjustSelfAssessmentInput,
  toSelfAssessmentAdjustmentHistoryResponse,
  toSelfAssessmentAdjustmentResponse,
} from './self-assessment-adjustments.mapper';

const createdAt = new Date('2026-10-12T12:00:00.000Z');
const adjustment = (previousValue: number, newValue: number) => ({
  previousValue,
  newValue,
  justification: 'Revisão após conversa com o aluno.',
  authorId: 'tutor',
  authorName: 'Tutor',
  createdAt,
});
const output = {
  originalScore: 7,
  currentScore: 9,
  adjustments: [adjustment(8, 9), adjustment(7, 8)],
};

describe('self-assessment adjustments mapper', () => {
  it('translates the Portuguese payload into the domain input', () => {
    expect(
      toAdjustSelfAssessmentInput(
        { novaNota: 9, justificativa: 'Revisão após conversa.' },
        'session',
        'student',
        'tutor',
      ),
    ).toEqual({
      sessionId: 'session',
      studentId: 'student',
      authorId: 'tutor',
      newScore: 9,
      justification: 'Revisão após conversa.',
    });
  });

  it('maps the history keeping the latest-first order', () => {
    const response = toSelfAssessmentAdjustmentHistoryResponse(output);

    expect(response).toMatchObject({ notaOriginal: 7, notaVigente: 9 });
    expect(response.ajustes.map((item) => item.valorNovo)).toEqual([9, 8]);
    expect(response.ajustes[0]).toEqual({
      valorAnterior: 8,
      valorNovo: 9,
      justificativa: 'Revisão após conversa com o aluno.',
      autor: { id: 'tutor', nome: 'Tutor' },
      ajustadoEm: createdAt,
    });
  });

  it('maps the created adjustment', () => {
    expect(
      toSelfAssessmentAdjustmentResponse('student', {
        originalScore: 7,
        currentScore: 9,
        adjustment: adjustment(8, 9),
      }),
    ).toMatchObject({
      alunoId: 'student',
      notaOriginal: 7,
      notaVigente: 9,
      ajuste: { valorAnterior: 8, valorNovo: 9, autor: { id: 'tutor', nome: 'Tutor' } },
    });
  });
});
