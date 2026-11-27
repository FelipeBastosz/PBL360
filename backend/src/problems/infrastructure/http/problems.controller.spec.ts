import { ProblemsController } from './problems.controller';

describe('ProblemsController', () => {
  const problem = {
    id: 'p1',
    roomId: 'r1',
    title: 'Problema',
    description: 'Descrição',
    orderIndex: 1,
    startDate: null,
    endDate: null,
    selfEvalReleased: false,
    peerEvalReleased: false,
    releasedAt: null,
    selfEvalDeadline: null,
    createdBy: 't1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
  };
  const makeController = (mocks: Record<string, { execute: jest.Mock }>) =>
    new ProblemsController(
      mocks.create as never,
      mocks.list as never,
      mocks.get as never,
      mocks.update as never,
      mocks.impact as never,
      mocks.remove as never,
    );

  it('creates a problem and converts optional dates to ISO input', async () => {
    const create = { execute: jest.fn().mockResolvedValue(problem) };
    const controller = makeController({
      create,
      list: {} as never,
      get: {} as never,
      update: {} as never,
      impact: {} as never,
      remove: {} as never,
    });

    await expect(
      controller.create('r1', { titulo: 'Problema', descricao: 'Descrição' }, 't1'),
    ).resolves.toMatchObject({
      id: 'p1',
      salaId: 'r1',
      titulo: 'Problema',
      descricao: 'Descrição',
    });
    expect(create.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      authorId: 't1',
      title: 'Problema',
      description: 'Descrição',
      startDate: null,
      endDate: null,
    });
  });

  it('lists, gets and updates problems for the supplied member and tutor', async () => {
    const member = { id: 's1', type: 'STUDENT' };
    const list = { execute: jest.fn().mockResolvedValue([problem]) };
    const get = { execute: jest.fn().mockResolvedValue(problem) };
    const update = { execute: jest.fn().mockResolvedValue(problem) };
    const controller = makeController({
      create: {} as never,
      list,
      get,
      update,
      impact: {} as never,
      remove: {} as never,
    });

    await expect(controller.list('r1', member)).resolves.toHaveLength(1);
    expect(list.execute).toHaveBeenCalledWith({ roomId: 'r1', member });
    await expect(controller.getById('r1', 'p1', 't1')).resolves.toMatchObject({ id: 'p1' });
    expect(get.execute).toHaveBeenCalledWith({ roomId: 'r1', problemId: 'p1', tutorId: 't1' });
    const dto = { titulo: 'Atualizado' } as never;
    await expect(controller.update('r1', 'p1', dto, 't1')).resolves.toBe(problem);
    expect(update.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      dto,
    });
  });

  it('returns deletion impact and delegates deletion', async () => {
    const impact = {
      execute: jest
        .fn()
        .mockResolvedValue({ sessions: 1, grades: 2, feedbacks: 3, evaluations: 4 }),
    };
    const remove = { execute: jest.fn() };
    const controller = makeController({
      create: {} as never,
      list: {} as never,
      get: {} as never,
      update: {} as never,
      impact,
      remove,
    });

    await expect(controller.getDeletionImpact('r1', 'p1', 't1')).resolves.toEqual({
      sessoes: 1,
      notas: 2,
      feedbacks: 3,
      avaliacoes: 4,
    });
    expect(impact.execute).toHaveBeenCalledWith({ roomId: 'r1', problemId: 'p1', tutorId: 't1' });
    await expect(controller.delete('r1', 'p1', 't1')).resolves.toBeUndefined();
    expect(remove.execute).toHaveBeenCalledWith({ roomId: 'r1', problemId: 'p1', tutorId: 't1' });
  });
});
