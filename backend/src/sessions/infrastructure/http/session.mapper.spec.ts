import { toSessionDeletionImpactResponse } from './session.mapper';

describe('toSessionDeletionImpactResponse', () => {
  it('translates the deletion impact to the Portuguese contract', () => {
    const response = toSessionDeletionImpactResponse({
      canDelete: false,
      rollCall: 1,
      roles: 2,
      observations: 3,
      evaluations: 4,
      feedbacks: 5,
    });

    expect(response).toEqual({
      podeExcluir: false,
      chamada: 1,
      papeis: 2,
      observacoes: 3,
      avaliacoes: 4,
      feedbacks: 5,
    });
    expect(Object.keys(response)).toEqual([
      'podeExcluir',
      'chamada',
      'papeis',
      'observacoes',
      'avaliacoes',
      'feedbacks',
    ]);
  });
});
