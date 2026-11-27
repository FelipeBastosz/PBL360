import { FinalGradeFormulaController } from './final-grade-formula.controller';

describe('FinalGradeFormulaController', () => {
  it('delegates reads and returns the stored final grade formula', async () => {
    const formula = { scope: 'PROFESSOR', components: [] };
    const useCase = { get: jest.fn().mockResolvedValue(formula) };
    const controller = new FinalGradeFormulaController(useCase as never);

    await expect(controller.get('r1', 'p1', 't1')).resolves.toBe(formula);
    expect(useCase.get).toHaveBeenCalledWith('r1', 'p1', 't1');
  });

  it('passes session weights to customization', async () => {
    const useCase = { customize: jest.fn().mockResolvedValue({ updated: true }) };
    const controller = new FinalGradeFormulaController(useCase as never);
    const weights = [{ sessaoId: 's1', peso: 1.5 }];

    await expect(controller.customize('r1', 'p1', { sessoes: weights }, 't1')).resolves.toEqual({
      updated: true,
    });
    expect(useCase.customize).toHaveBeenCalledWith('r1', 'p1', 't1', weights);
  });

  it('restores the default final grade formula', async () => {
    const useCase = { restore: jest.fn().mockResolvedValue({ restored: true }) };
    const controller = new FinalGradeFormulaController(useCase as never);

    await expect(controller.restore('r1', 'p1', 't1')).resolves.toEqual({ restored: true });
    expect(useCase.restore).toHaveBeenCalledWith('r1', 'p1', 't1');
  });
});
