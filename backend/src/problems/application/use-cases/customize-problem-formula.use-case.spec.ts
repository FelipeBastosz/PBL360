import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { InvalidProblemError } from '../../domain/errors/invalid-problem.error';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { CustomizeProblemFormulaUseCase } from './customize-problem-formula.use-case';

describe('CustomizeProblemFormulaUseCase', () => {
  const input = {
    roomId: 'r1',
    problemId: 'p1',
    tutorId: 't1',
    scope: FormulaScope.PROBLEMA,
    components: [{ type: 'MEDIA_SESSOES', weight: 100 }],
  };
  const setup = (oldFormula: Formula | null = null) => {
    const access = { assertTutorCanAccessRoom: jest.fn() };
    const problems = { findById: jest.fn().mockResolvedValue({ id: 'p1', roomId: 'r1' }) };
    const formulas = {
      findActiveByProblemAndScope: jest.fn().mockResolvedValue(oldFormula),
      saveNewVersion: jest.fn(),
    };
    const output = { scope: FormulaScope.PROBLEMA, components: [] };
    const getFormula = { execute: jest.fn().mockResolvedValue(output) };
    const useCase = new CustomizeProblemFormulaUseCase(
      problems as never,
      formulas as never,
      access as never,
      getFormula as never,
    );
    return { useCase, access, problems, formulas, getFormula, output };
  };

  it('creates and saves a new problem formula version then returns the refreshed formula', async () => {
    const previous = Formula.create({
      problemId: 'p1',
      scope: FormulaScope.PROBLEMA,
      version: 3,
      createdBy: 't1',
      components: [
        { type: 'MEDIA_SESSOES', weight: 100 },
        { type: 'SESSAO', referenceId: 's1', weight: 1 },
      ],
    });
    const { useCase, access, formulas, getFormula, output } = setup(previous);
    await expect(useCase.execute(input)).resolves.toBe(output);
    expect(access.assertTutorCanAccessRoom).toHaveBeenCalledWith('r1', 't1');
    expect(formulas.saveNewVersion).toHaveBeenCalledWith(
      previous,
      expect.objectContaining({
        problemId: 'p1',
        scope: FormulaScope.PROBLEMA,
        version: 4,
        components: [
          { type: 'MEDIA_SESSOES', referenceId: null, weight: 100 },
          { type: 'SESSAO', referenceId: 's1', weight: 1 },
        ],
      }),
    );
    expect(getFormula.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      scope: FormulaScope.PROBLEMA,
    });
  });

  it('rejects wrong scopes, invalid components and problems outside the room', async () => {
    const wrongScope = setup();
    await expect(
      wrongScope.useCase.execute({ ...input, scope: FormulaScope.SESSAO }),
    ).rejects.toThrow(
      new UnprocessableEntityError(
        'A fórmula da sessão deve ser personalizada pela configuração da própria sessão.',
      ),
    );
    const invalidInput = setup();
    await expect(
      invalidInput.useCase.execute({
        ...input,
        components: [{ type: 'SESSAO', referenceId: 's1', weight: 100 }],
      }),
    ).rejects.toThrow(
      new UnprocessableEntityError(
        'A nota do problema é a média das sessões; configure os pesos pela fórmula final.',
      ),
    );
    const missing = setup();
    missing.problems.findById.mockResolvedValue({ id: 'p1', roomId: 'other' });
    await expect(missing.useCase.execute(input)).rejects.toThrow(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );

    const absent = setup();
    absent.problems.findById.mockResolvedValue(null);
    await expect(absent.useCase.execute(input)).rejects.toThrow(
      new NotFoundError('Problema não encontrado na sala informada.'),
    );

    const invalidFormula = setup();
    await expect(
      invalidFormula.useCase.execute({
        roomId: 'r1',
        problemId: 'p1',
        tutorId: 't1',
        scope: 'SESSAO' as never,
        components: [{ type: 'CRITERIOS', weight: 50 }],
      }),
    ).rejects.toThrow(UnprocessableEntityError);

    const persistenceError = setup();
    persistenceError.formulas.saveNewVersion.mockRejectedValue(new Error('DB failure'));
    await expect(
      persistenceError.useCase.execute({
        roomId: 'r1',
        problemId: 'p1',
        tutorId: 't1',
        scope: FormulaScope.PROBLEMA,
        components: [{ type: 'MEDIA_SESSOES', weight: 100 }],
      }),
    ).rejects.toThrow('DB failure');
  });

  it('converts formula domain validation errors into an unprocessable response', async () => {
    const { useCase } = setup();
    const createFormula = jest.spyOn(Formula, 'create').mockImplementationOnce(() => {
      throw new InvalidProblemError('Formula is invalid.');
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      new UnprocessableEntityError('Formula is invalid.'),
    );
    createFormula.mockRestore();
  });
});
