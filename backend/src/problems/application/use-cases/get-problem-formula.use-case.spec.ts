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
    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'tutor-1');
  });

  it('defaults scope to PROBLEMA when omitted and allows co-tutor access', async () => {
    const problems = {
      findById: jest.fn().mockResolvedValue({ id: 'problem-1', roomId: 'room-1' }),
    };
    const formulas = {
      findActiveByProblemAndScope: jest.fn().mockResolvedValue(null),
    };
    const roomAccess = { assertTutorCanAccessRoom: jest.fn().mockResolvedValue(undefined) };
    const useCase = new GetProblemFormulaUseCase(
      problems as never,
      formulas as never,
      roomAccess as never,
    );

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'co-tutor-1',
    });

    expect(roomAccess.assertTutorCanAccessRoom).toHaveBeenCalledWith('room-1', 'co-tutor-1');
    expect(formulas.findActiveByProblemAndScope).toHaveBeenCalledWith(
      'problem-1',
      FormulaScope.PROBLEMA,
    );
    expect(result).toEqual({
      scope: FormulaScope.PROBLEMA,
      isDefault: true,
      version: null,
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

  it('rejects with ForbiddenError when tutor has no relation to room', async () => {
    const problems = { findById: jest.fn() };
    const formulas = { findActiveByProblemAndScope: jest.fn() };
    const roomAccess = {
      assertTutorCanAccessRoom: jest.fn().mockRejectedValue(new Error('Forbidden')),
    };
    const useCase = new GetProblemFormulaUseCase(
      problems as never,
      formulas as never,
      roomAccess as never,
    );

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        tutorId: 'unrelated-tutor',
      }),
    ).rejects.toThrow('Forbidden');
    expect(problems.findById).not.toHaveBeenCalled();
    expect(formulas.findActiveByProblemAndScope).not.toHaveBeenCalled();
  });
});
