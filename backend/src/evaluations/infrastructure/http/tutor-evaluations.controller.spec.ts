import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { TutorEvaluationsController } from './tutor-evaluations.controller';

describe('TutorEvaluationsController', () => {
  const config = {
    tableId: 'pt1',
    tableName: 'Barema',
    criteria: [],
    frozen: false,
    formula: null,
  };

  it('maps session evaluation summaries', async () => {
    const list = {
      execute: jest.fn().mockResolvedValue([
        {
          studentId: 's1',
          name: 'Ana Souza',
          status: EvaluationStatus.SUBMITTED,
          sessionScore: 8,
        },
      ]),
    };
    const controller = new TutorEvaluationsController(list as never, {} as never, {} as never);

    await expect(controller.list('sess1', 't1')).resolves.toMatchObject([
      { alunoId: 's1', nome: 'Ana Souza', iniciais: 'AS', notaSessao: 8 },
    ]);
    expect(list.execute).toHaveBeenCalledWith('sess1', 't1');
  });

  it('returns detailed criteria and maps tutor submission input', async () => {
    const detail = {
      config,
      evaluation: {
        status: EvaluationStatus.DRAFT,
        submittedAt: null,
        items: [],
        sessionScore: null,
        appliedBonus: null,
      },
      adjustments: [],
      papel: null,
      roleScore: null,
    };
    const get = { execute: jest.fn().mockResolvedValue(detail) };
    const save = { execute: jest.fn().mockResolvedValue(detail) };
    const controller = new TutorEvaluationsController({} as never, get as never, save as never);

    await expect(controller.get('sess1', 's1', 't1')).resolves.toMatchObject({
      status: 'RASCUNHO',
      tabela: { id: 'pt1' },
    });
    expect(get.execute).toHaveBeenCalledWith('sess1', 's1', 't1');
    const dto = {
      itens: [{ criterioId: 'c1', nota: 9 }],
      enviar: false,
      justificativa: 'ajuste registrado',
    };
    await controller.put('sess1', 's1', 't1', dto);
    expect(save.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      studentId: 's1',
      authorId: 't1',
      items: [{ criterionId: 'c1', score: 9 }],
      submit: false,
      justification: 'ajuste registrado',
      notaCargo: undefined,
    });
  });
});
