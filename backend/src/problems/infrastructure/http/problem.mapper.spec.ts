import {
  toProblemDeletionImpactResponse,
  toProblemPerformanceTableResponse,
} from './problem.mapper';

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

  it('translates the performance table change to the Portuguese contract', () => {
    const response = toProblemPerformanceTableResponse({
      problemId: 'prob-1',
      table: { id: 'table-1', name: 'Barema PBL' },
    });

    expect(response).toEqual({
      problemaId: 'prob-1',
      tabela: { id: 'table-1', nome: 'Barema PBL' },
    });
  });
});
