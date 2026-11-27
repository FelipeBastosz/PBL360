import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { PgFormulaRepository } from './pg-formula.repository';

describe('PgFormulaRepository', () => {
  it('queries active formulas by problem scope and tutor', async () => {
    const formula = new Formula();
    const findOne = jest.fn().mockResolvedValueOnce(formula).mockResolvedValueOnce(null);
    const repository = new PgFormulaRepository({ findOne } as never);

    await expect(
      repository.findActiveByProblemAndScope('problem-1', FormulaScope.PROBLEMA),
    ).resolves.toBe(formula);
    expect(findOne).toHaveBeenNthCalledWith(1, {
      where: { problemId: 'problem-1', scope: FormulaScope.PROBLEMA, active: true },
      relations: ['components'],
    });
    await expect(repository.findActiveByTutor('tutor-1')).resolves.toBeNull();
    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: { createdBy: 'tutor-1', scope: FormulaScope.PROFESSOR, active: true },
      relations: ['components'],
    });
  });

  it('deactivates an old formula before saving its replacement in one transaction', async () => {
    const oldFormula = new Formula();
    oldFormula.active = true;
    const newFormula = new Formula();
    const save = jest.fn().mockResolvedValueOnce(oldFormula).mockResolvedValueOnce(newFormula);
    const transaction = jest.fn((work: (manager: { save: jest.Mock }) => unknown) =>
      work({ save }),
    );
    const repository = new PgFormulaRepository({ manager: { transaction }, save } as never);

    await expect(repository.saveNewVersion(oldFormula, newFormula)).resolves.toBe(newFormula);
    expect(oldFormula.active).toBe(false);
    expect(save).toHaveBeenNthCalledWith(1, Formula, oldFormula);
    expect(save).toHaveBeenNthCalledWith(2, Formula, newFormula);

    const noPreviousSave = jest.fn().mockResolvedValue(newFormula);
    const noPreviousRepo = new PgFormulaRepository({
      manager: {
        transaction: (work: (manager: { save: jest.Mock }) => unknown) =>
          work({ save: noPreviousSave }),
      },
    } as never);
    await noPreviousRepo.saveNewVersion(null, newFormula);
    expect(noPreviousSave).toHaveBeenCalledTimes(1);
  });

  it('deactivates a formula through the repository', async () => {
    const formula = new Formula();
    formula.active = true;
    const save = jest.fn();
    const repository = new PgFormulaRepository({ save } as never);

    await repository.deactivate(formula);
    expect(formula.active).toBe(false);
    expect(save).toHaveBeenCalledWith(formula);
  });
});
