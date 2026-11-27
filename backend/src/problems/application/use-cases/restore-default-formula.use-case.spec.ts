import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { RestoreDefaultFormulaUseCase } from './restore-default-formula.use-case';

describe('RestoreDefaultFormulaUseCase', () => {
  const input = { roomId: 'r1', problemId: 'p1', tutorId: 't1', scope: FormulaScope.PROBLEMA };
  const setup = (active: Formula | null) => {
    const access = { assertTutorCanAccessRoom: jest.fn() };
    const problems = { findById: jest.fn().mockResolvedValue({ id: 'p1', roomId: 'r1' }) };
    const formulas = {
      findActiveByProblemAndScope: jest.fn().mockResolvedValue(active),
      deactivate: jest.fn(),
      saveNewVersion: jest.fn(),
    };
    const output = { scope: FormulaScope.PROBLEMA };
    const getFormula = { execute: jest.fn().mockResolvedValue(output) };
    const useCase = new RestoreDefaultFormulaUseCase(
      problems as never,
      formulas as never,
      access as never,
      getFormula as never,
    );
    return { useCase, problems, formulas, getFormula, output };
  };

  it('does not update formulas when no active formula exists', async () => {
    const { useCase, formulas, getFormula, output } = setup(null);
    await expect(useCase.execute(input)).resolves.toBe(output);
    expect(formulas.deactivate).not.toHaveBeenCalled();
    expect(formulas.saveNewVersion).not.toHaveBeenCalled();
    expect(getFormula.execute).toHaveBeenCalledWith(input);
  });

  it('deactivates formulas without session components', async () => {
    const active = Formula.create({
      problemId: 'p1',
      scope: FormulaScope.PROBLEMA,
      version: 2,
      createdBy: 't1',
      components: [{ type: 'MEDIA_SESSOES', weight: 100 }],
    });
    const { useCase, formulas } = setup(active);
    await useCase.execute(input);
    expect(formulas.deactivate).toHaveBeenCalledWith(active);
  });

  it('saves a default version while preserving session components', async () => {
    const active = Formula.create({
      problemId: 'p1',
      scope: FormulaScope.PROBLEMA,
      version: 2,
      createdBy: 't1',
      components: [
        { type: 'SESSAO', referenceId: 's1', weight: 4 },
        { type: 'MEDIA_SESSOES', weight: 100 },
      ],
    });
    const { useCase, formulas } = setup(active);
    await useCase.execute(input);
    expect(formulas.saveNewVersion).toHaveBeenCalledWith(
      active,
      expect.objectContaining({
        version: 3,
        components: [
          { type: 'MEDIA_SESSOES', referenceId: null, weight: 100 },
          { type: 'SESSAO', referenceId: 's1', weight: 4 },
        ],
      }),
    );
  });

  it('rejects invalid scopes and problems outside the room', async () => {
    const wrongScope = setup(null);
    await expect(
      wrongScope.useCase.execute({ ...input, scope: FormulaScope.SESSAO }),
    ).rejects.toThrow(
      new UnprocessableEntityError(
        'A fórmula da sessão deve ser restaurada pela configuração da própria sessão.',
      ),
    );
    const missing = setup(null);
    missing.problems.findById.mockResolvedValue({ id: 'p1', roomId: 'elsewhere' });
    await expect(missing.useCase.execute(input)).rejects.toThrow(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );
  });
});
