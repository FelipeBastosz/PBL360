import { FormulaScope } from '../../domain/entities/formula.entity';
import { ProblemFormulasController } from './problem-formulas.controller';

describe('ProblemFormulasController', () => {
  const formula = {
    scope: FormulaScope.PROBLEMA,
    isDefault: false,
    version: 2,
    components: [
      { type: 'MEDIA_SESSOES', referenceId: null, name: 'Média das sessões', weight: 100 },
    ],
  };

  it('gets the requested problem formula scope, defaulting to problem scope', async () => {
    const get = { execute: jest.fn().mockResolvedValue(formula) };
    const controller = new ProblemFormulasController(get as never, {} as never, {} as never);

    await expect(controller.get('r1', 'p1', undefined as never, 't1')).resolves.toEqual({
      escopo: FormulaScope.PROBLEMA,
      padrao: false,
      versao: 2,
      componentes: [
        { tipo: 'MEDIA_SESSOES', referenciaId: null, nome: 'Média das sessões', peso: 100 },
      ],
    });
    await controller.get('r1', 'p1', FormulaScope.PROBLEMA, 't1');
    expect(get.execute).toHaveBeenNthCalledWith(1, {
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      scope: FormulaScope.PROBLEMA,
    });
    expect(get.execute).toHaveBeenNthCalledWith(2, {
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      scope: FormulaScope.PROBLEMA,
    });
  });

  it('maps DTO components before customizing and restores the requested scope', async () => {
    const customize = { execute: jest.fn().mockResolvedValue(formula) };
    const restore = { execute: jest.fn().mockResolvedValue(formula) };
    const controller = new ProblemFormulasController(
      {} as never,
      customize as never,
      restore as never,
    );
    const dto = {
      escopo: FormulaScope.PROBLEMA,
      componentes: [{ tipo: 'MEDIA_SESSOES', referenciaId: null, peso: 100 }],
    };

    await controller.customize('r1', 'p1', dto, 't1');
    expect(customize.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      scope: FormulaScope.PROBLEMA,
      components: [{ type: 'MEDIA_SESSOES', referenceId: null, weight: 100 }],
    });

    await controller.restoreDefault('r1', 'p1', { escopo: FormulaScope.PROBLEMA }, 't2');
    expect(restore.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't2',
      scope: FormulaScope.PROBLEMA,
    });
  });
});
