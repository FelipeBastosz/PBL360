import { FormulaScope } from '../../domain/entities/formula.entity';
import { TeacherFormulasController } from './teacher-formulas.controller';

describe('TeacherFormulasController', () => {
  it('returns the current teacher formula', async () => {
    const formula = {
      id: 'f1',
      scope: FormulaScope.PROFESSOR,
      isDefault: true,
      version: 2,
      components: [
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ],
    };
    const get = { execute: jest.fn().mockResolvedValue(formula) };
    const controller = new TeacherFormulasController(get as never, {} as never);

    await expect(controller.get('t1')).resolves.toEqual({
      id: 'f1',
      escopo: FormulaScope.PROFESSOR,
      padrao: true,
      versao: 2,
      componentes: [
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ],
    });
    expect(get.execute).toHaveBeenCalledWith({ tutorId: 't1' });
  });

  it('maps and submits updated components for the authenticated tutor', async () => {
    const formula = {
      scope: FormulaScope.PROFESSOR,
      isDefault: false,
      version: 3,
      components: [{ type: 'CRITERIOS', weight: 65 }],
    };
    const update = { execute: jest.fn().mockResolvedValue(formula) };
    const controller = new TeacherFormulasController({} as never, update as never);

    await expect(
      controller.update('t2', { componentes: [{ tipo: 'CRITERIOS', peso: 65 }] }),
    ).resolves.toEqual({
      escopo: FormulaScope.PROFESSOR,
      padrao: false,
      versao: 3,
      componentes: [{ tipo: 'CRITERIOS', peso: 65 }],
    });
    expect(update.execute).toHaveBeenCalledWith({
      tutorId: 't2',
      components: [{ type: 'CRITERIOS', weight: 65 }],
    });
  });
});
