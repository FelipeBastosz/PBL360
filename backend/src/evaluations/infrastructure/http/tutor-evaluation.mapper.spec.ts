import { toSaveTutorEvaluationInput } from './tutor-evaluation.mapper';

describe('toSaveTutorEvaluationInput', () => {
  it('maps evaluation criteria and submission fields to the use case input', () => {
    expect(
      toSaveTutorEvaluationInput(
        {
          itens: [{ criterioId: 'criterion-1', nota: 8 }],
          enviar: true,
          justificativa: 'Revisão',
          notaCargo: 2,
        },
        'session-1',
        'student-1',
        'tutor-1',
      ),
    ).toEqual({
      sessionId: 'session-1',
      studentId: 'student-1',
      authorId: 'tutor-1',
      items: [{ criterionId: 'criterion-1', score: 8 }],
      submit: true,
      justification: 'Revisão',
      notaCargo: 2,
    });
  });

  it('preserves omitted optional fields', () => {
    expect(toSaveTutorEvaluationInput({ itens: [], enviar: false }, 's', 'u', 't')).toMatchObject({
      items: [],
      submit: false,
    });
  });
});
