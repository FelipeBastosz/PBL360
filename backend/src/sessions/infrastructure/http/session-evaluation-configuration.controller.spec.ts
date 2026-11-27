import { SessionEvaluationConfigurationController } from './session-evaluation-configuration.controller';

describe('SessionEvaluationConfigurationController', () => {
  it('delegates reads and formula reads to the configuration service', async () => {
    const configuration = {
      get: jest.fn().mockResolvedValue({ bloqueada: false }),
      getFormula: jest.fn().mockResolvedValue({ padrao: true }),
    };
    const controller = new SessionEvaluationConfigurationController(configuration as never);

    await expect(controller.get('sess1', 't1')).resolves.toEqual({ bloqueada: false });
    await expect(controller.getFormula('sess1', 't1')).resolves.toEqual({ padrao: true });
    expect(configuration.get).toHaveBeenCalledWith('sess1', 't1');
    expect(configuration.getFormula).toHaveBeenCalledWith('sess1', 't1');
  });

  it('sets the table or formula and defaults propagation to false', async () => {
    const configuration = {
      setTable: jest.fn().mockResolvedValue({ applied: true }),
      setFormula: jest.fn().mockResolvedValue({ applied: true }),
      restoreFormula: jest.fn().mockResolvedValue({ restored: true }),
    };
    const controller = new SessionEvaluationConfigurationController(configuration as never);

    await controller.setTable('sess1', { tabelaId: 'pt1' }, 't1');
    expect(configuration.setTable).toHaveBeenCalledWith('sess1', 't1', 'pt1', false);
    const components = [{ tipo: 'CRITERIOS', peso: 70 }];
    await controller.setFormula('sess1', { componentes: components }, 't1');
    expect(configuration.setFormula).toHaveBeenCalledWith('sess1', 't1', components, false);
    await expect(controller.restoreFormula('sess1', 't1')).resolves.toEqual({ restored: true });
    expect(configuration.restoreFormula).toHaveBeenCalledWith('sess1', 't1');
  });
});
