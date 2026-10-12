import { toProblemDeletionImpactResponse } from './problem.mapper';

describe('problem mapper', () => {
  it('translates the deletion impact to the Portuguese contract', () => {
    const response = toProblemDeletionImpactResponse({
      sessions: 3,
      grades: 0,
      feedbacks: 1,
      evaluations: 2,
    });

    expect(response).toEqual({ sessoes: 3, notas: 0, feedbacks: 1, avaliacoes: 2 });
  });
});
