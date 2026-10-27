import { FormulaScope } from '../../domain/entities/formula.entity';
import { GetProblemFormulaUseCase } from './get-problem-formula.use-case';

describe('GetProblemFormulaUseCase', () => {
  it('returns only the session average for a legacy formula with self and peer components', async () => {
    const formula = {
      version: 3,
      components: [
        { type: 'MEDIA_SESSOES', referenceId: null, weight: 60 },
        { type: 'AUTOAVALIACAO', referenceId: null, weight: 20 },
        { type: 'PARES', referenceId: null, weight: 20 },
        { type: 'SESSAO', referenceId: 'session-1', weight: 2 },
      ],
    };
    const problems = {
      findById: jest.fn().mockResolvedValue({ id: 'problem-1', roomId: 'room-1' }),
    };
    const formulas = {
      findActiveByProblemAndScope: jest.fn().mockResolvedValue(formula),
    };
    const roomAccess = { assertTutorCanAccessRoom: jest.fn().mockResolvedValue(undefined) };
    const useCase = new GetProblemFormulaUseCase(
      problems as never,
      formulas as never,
      roomAccess as never,
    );

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        tutorId: 'tutor-1',
        scope: FormulaScope.PROBLEMA,
      }),
    ).resolves.toEqual({
      scope: FormulaScope.PROBLEMA,
      isDefault: false,
      version: 3,
      components: [
        {
          type: 'MEDIA_SESSOES',
          referenceId: null,
          name: 'Média das Sessões',
          weight: 100,
        },
      ],
    });
  });
});
