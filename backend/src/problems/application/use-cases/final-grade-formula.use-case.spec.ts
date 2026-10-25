import { UnprocessableEntityError } from '@/shared/errors/application.error';
import { type RoomAccessService } from '@/rooms/application/services/room-access.service';
import { Formula, FormulaScope } from '../../domain/entities/formula.entity';
import { FinalGradeFormulaUseCase } from './final-grade-formula.use-case';

describe('FinalGradeFormulaUseCase', () => {
  let useCase: FinalGradeFormulaUseCase;
  let active: Formula | null;
  const sessions = [
    { id: 'session-1', title: 'Sessão 1' },
    { id: 'session-2', title: 'Sessão 2' },
  ];
  const saveNewVersion = jest.fn((_old: Formula | null, next: Formula) => {
    active = next;
    return Promise.resolve(next);
  });
  const formulas = {
    findActiveByProblemAndScope: jest.fn(() => Promise.resolve(active)),
    saveNewVersion,
    deactivate: jest.fn(() => Promise.resolve()),
  };
  const problems = {
    findById: jest.fn(() => Promise.resolve({ id: 'problem-1', roomId: 'room-1' })),
    listSessions: jest.fn(() => Promise.resolve(sessions)),
  };
  const roomAccess = { assertTutorCanAccessRoom: jest.fn(() => Promise.resolve()) };

  const existingFormula = () =>
    Formula.create({
      problemId: 'problem-1',
      scope: FormulaScope.PROBLEMA,
      version: 4,
      createdBy: 'tutor-1',
      components: [
        { type: 'MEDIA_SESSOES', weight: 80 },
        { type: 'AUTOAVALIACAO', weight: 20 },
        { type: 'PARES', weight: 0 },
        { type: 'SESSAO', referenceId: 'session-1', weight: 3 },
        { type: 'SESSAO', referenceId: 'session-2', weight: 1 },
      ],
    });

  beforeEach(() => {
    active = null;
    jest.clearAllMocks();
    useCase = new FinalGradeFormulaUseCase(
      problems as never,
      formulas,
      roomAccess as unknown as RoomAccessService,
    );
  });

  it('returns simple-average defaults when no session weights are stored', async () => {
    const result = await useCase.get('room-1', 'problem-1', 'tutor-1');

    expect(result).toEqual({
      padrao: true,
      versao: null,
      sessoes: [
        { sessaoId: 'session-1', rotulo: 'Sessão 1', peso: 1 },
        { sessaoId: 'session-2', rotulo: 'Sessão 2', peso: 1 },
      ],
    });
  });

  it('reports no session-formula version when only the percentage formula is customized', async () => {
    active = Formula.create({
      problemId: 'problem-1',
      scope: FormulaScope.PROBLEMA,
      version: 4,
      createdBy: 'tutor-1',
      components: [
        { type: 'MEDIA_SESSOES', weight: 80 },
        { type: 'AUTOAVALIACAO', weight: 20 },
        { type: 'PARES', weight: 0 },
      ],
    });

    await expect(useCase.get('room-1', 'problem-1', 'tutor-1')).resolves.toMatchObject({
      padrao: true,
      versao: null,
    });
  });

  it('saves relative weights as a new version and preserves the percentage formula', async () => {
    active = existingFormula();

    const result = await useCase.customize('room-1', 'problem-1', 'tutor-1', [
      { sessaoId: 'session-1', peso: 2 },
      { sessaoId: 'session-2', peso: 5 },
    ]);

    expect(active?.version).toBe(5);
    expect(
      active?.components.map(({ type, referenceId, weight }) => ({ type, referenceId, weight })),
    ).toEqual([
      { type: 'MEDIA_SESSOES', referenceId: null, weight: 80 },
      { type: 'AUTOAVALIACAO', referenceId: null, weight: 20 },
      { type: 'PARES', referenceId: null, weight: 0 },
      { type: 'SESSAO', referenceId: 'session-1', weight: 2 },
      { type: 'SESSAO', referenceId: 'session-2', weight: 5 },
    ]);
    expect(result).toMatchObject({ padrao: false, versao: 5 });
  });

  it('rejects a session that does not belong to the problem', async () => {
    await expect(
      useCase.customize('room-1', 'problem-1', 'tutor-1', [
        { sessaoId: 'session-1', peso: 1 },
        { sessaoId: 'other-session', peso: 1 },
      ]),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it.each([0, 10.01])('rejects invalid relative weight %s', async (peso) => {
    await expect(
      useCase.customize('room-1', 'problem-1', 'tutor-1', [
        { sessaoId: 'session-1', peso },
        { sessaoId: 'session-2', peso: 1 },
      ]),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('restores simple session averaging and keeps the percentage components', async () => {
    active = existingFormula();

    const result = await useCase.restore('room-1', 'problem-1', 'tutor-1');

    expect(active?.version).toBe(5);
    expect(active?.components.map(({ type, weight }) => ({ type, weight }))).toEqual([
      { type: 'MEDIA_SESSOES', weight: 80 },
      { type: 'AUTOAVALIACAO', weight: 20 },
      { type: 'PARES', weight: 0 },
    ]);
    expect(result).toMatchObject({ padrao: true, versao: null });
    expect(formulas.deactivate).not.toHaveBeenCalled();
  });
});
