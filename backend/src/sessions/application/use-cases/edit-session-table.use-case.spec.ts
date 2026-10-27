import {
  ConflictError,
  ForbiddenError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type {
  SessionTableEditingRepository,
  SessionTableEditPlan,
  TableEditScope,
} from '../../domain/repositories/session-table-editing.repository';
import { tableEditContext, tableEditInput } from '../../testing/session-table-editing.fixture';
import { EditSessionTableUseCase } from './edit-session-table.use-case';

describe('EditSessionTableUseCase', () => {
  function setup(occurred = false) {
    const context = tableEditContext(occurred);
    let plan: SessionTableEditPlan | undefined;
    const repository: SessionTableEditingRepository = {
      getContext: jest.fn().mockResolvedValue(context),
      edit: jest.fn((_input, prepare) =>
        Promise.resolve().then(() => {
          plan = prepare(context);
          return { table: plan.table, sessions: plan.sessions };
        }),
      ),
    };
    return { context, useCase: new EditSessionTableUseCase(repository), plan: () => plan! };
  }

  it.each<[boolean, TableEditScope]>([
    [false, 'SESSAO'],
    [false, 'TODAS'],
    [true, 'SESSAO'],
    [true, 'TODAS'],
  ])('applies the correct scope when occurred=%s and scope=%s', async (occurred, scope) => {
    const { useCase, plan, context } = setup(occurred);
    const input = tableEditInput(scope);
    if (!occurred) {
      input.name = 'Novo barema';
      input.criteria[0]!.name = 'Autonomia';
    }
    await useCase.execute(input);
    expect(plan().copy).toBe(scope === 'SESSAO');
    expect(plan().sessions.map((session) => session.sessionId)).toEqual(
      scope === 'SESSAO' ? ['session'] : ['session', 'other'],
    );
    expect(plan().table.criteria.map((criterion) => criterion.weight)).toEqual([8, 2]);
    expect(plan().table.name).toBe(
      `${occurred ? 'Barema' : 'Novo barema'}${scope === 'SESSAO' ? ' — P1S2' : ''}`,
    );
    expect(plan().table.roomId).toBe(scope === 'SESSAO' ? 'room' : null);
    expect(context.table.criteria[0]!.weight).toBe(5);
    expect(context.table.name).toBe('Barema');
  });

  it('uses the state read inside the transaction even if the preceding permission query allowed full editing', async () => {
    const { useCase, context } = setup(false);
    context.sessions[1]!.hasOccurred = true;
    await expect(useCase.execute({ ...tableEditInput(), name: 'Changed' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it.each(['SESSAO', 'TODAS'] as const)(
    'accepts only IDs and weights in restricted %s edits',
    async (scope) => {
      const { useCase, plan } = setup(true);
      const input = tableEditInput(scope);
      input.criteria = [
        { id: 'criterion-1', weight: 2 },
        { id: 'criterion-0', weight: 8 },
      ];
      await useCase.execute(input);
      expect(plan().table.criteria.map((criterion) => criterion.orderIndex)).toEqual([2, 1]);
      expect(plan().table.criteria.map((criterion) => criterion.name)).toEqual([
        'Postura',
        'Participação',
      ]);
    },
  );

  it.each(['name', 'criterionName', 'add', 'remove', 'missingId'])(
    'rejects a restricted %s change',
    async (kind) => {
      const { useCase } = setup(true);
      const input = tableEditInput('SESSAO');
      if (kind === 'name') input.name = 'Barema';
      if (kind === 'criterionName') input.criteria[0]!.name = 'Novo';
      if (kind === 'add') input.criteria.push({ name: 'Novo', weight: 0 });
      if (kind === 'remove') input.criteria.pop();
      if (kind === 'missingId') delete input.criteria[0]!.id;
      await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictError);
    },
  );

  it('permits adding and removing criteria before any session has occurred', async () => {
    const { useCase, plan } = setup();
    const input = tableEditInput();
    input.criteria[1] = { name: 'Evolução', weight: 2 };
    await useCase.execute(input);
    expect(plan().table.criteria[0]!.id).toBe('criterion-0');
    expect(plan().table.criteria[1]!.id).toBeUndefined();
    expect(plan().table.criteria[1]!.name).toBe('Evolução');
  });

  it('rejects editing a system default in the TODAS scope', async () => {
    const { useCase, context } = setup(false);
    context.table.isDefault = true;
    await expect(useCase.execute(tableEditInput('TODAS'))).rejects.toThrow(ForbiddenError);
  });

  it('allows an independent session copy of a system default', async () => {
    const { useCase, context, plan } = setup(false);
    context.table.isDefault = true;
    context.table.tutorId = null;
    await useCase.execute(tableEditInput('SESSAO'));
    expect(plan().copy).toBe(true);
    expect(plan().table.isDefault).toBe(false);
  });

  it('keeps copied names within the database limit', async () => {
    const { useCase, context, plan } = setup();
    context.session.label = 'S'.repeat(120);
    await useCase.execute({ ...tableEditInput('SESSAO'), name: 'T'.repeat(120) });
    expect(plan().table.name.length).toBeLessThanOrEqual(120);
    expect(plan().table.name).toContain(' — ');
  });

  it.each([-1, 11, NaN, Infinity, 8.001])('rejects an invalid weight of %s', async (weight) => {
    const { useCase } = setup();
    const input = tableEditInput();
    input.criteria[0]!.weight = weight;
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it.each(['duplicate', 'foreign', 'empty', 'sum', 'missingName'])(
    'rejects %s criteria',
    async (kind) => {
      const { useCase } = setup();
      const input = tableEditInput();
      if (kind === 'duplicate') input.criteria[1]!.id = input.criteria[0]!.id;
      if (kind === 'foreign') input.criteria[1]!.id = 'foreign';
      if (kind === 'empty') input.criteria = [];
      if (kind === 'sum') input.criteria[0]!.weight = 7;
      if (kind === 'missingName') delete input.criteria[0]!.name;
      await expect(useCase.execute(input)).rejects.toBeInstanceOf(UnprocessableEntityError);
    },
  );

  it('requires access to every affected room for TODAS', async () => {
    const { useCase, context } = setup();
    context.sessions[1]!.canAccess = false;
    await expect(useCase.execute(tableEditInput())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(useCase.execute(tableEditInput('SESSAO'))).resolves.toBeDefined();
  });

  it('does not let another room grant access to the current session', async () => {
    const { useCase, context } = setup();
    context.session.canAccess = false;
    await expect(useCase.execute(tableEditInput('SESSAO'))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
