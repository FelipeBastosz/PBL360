import { ProblemEvaluationCriteriaController } from './problem-evaluation-criteria.controller';

describe('ProblemEvaluationCriteriaController', () => {
  it('returns table and ordered criteria for the requested problem', async () => {
    const config = {
      tableId: 'pt1',
      tableName: 'Barema',
      criteria: [{ id: 'c1', name: 'Participação', description: null, weight: 2, orderIndex: 1 }],
    };
    const get = { execute: jest.fn().mockResolvedValue(config) };
    const controller = new ProblemEvaluationCriteriaController(get as never);

    await expect(controller.get('r1', 'p1', 't1')).resolves.toEqual({
      tabela: { id: 'pt1', nome: 'Barema' },
      criterios: [
        { id: 'c1', nome: 'Participação', descricao: null, peso: 2, notaMaxima: 10, ordem: 1 },
      ],
    });
    expect(get.execute).toHaveBeenCalledWith('r1', 'p1', 't1');
  });
});
