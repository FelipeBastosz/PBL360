import { SessionsController } from './sessions.controller';

describe('SessionsController', () => {
  const session = {
    id: 'sess1',
    title: 'Sessão',
    description: 'Preparação',
    date: '2026-10-15',
    orderIndex: 1,
    status: 'PLANNED',
  };

  it('creates, lists, reads and updates sessions with date conversion', async () => {
    const create = { execute: jest.fn().mockResolvedValue(session) };
    const list = { execute: jest.fn().mockResolvedValue([session]) };
    const get = { execute: jest.fn().mockResolvedValue(session) };
    const update = { execute: jest.fn().mockResolvedValue(session) };
    const controller = new SessionsController(
      create as never,
      list as never,
      get as never,
      update as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.create(
        'r1',
        'p1',
        {
          titulo: 'Sessão',
          descricao: 'Preparação',
          data: '15-10-2026',
        },
        't1',
      ),
    ).resolves.toMatchObject({ id: 'sess1', problemaId: 'p1' });
    expect(create.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      tutorId: 't1',
      title: 'Sessão',
      description: 'Preparação',
      date: '2026-10-15',
    });

    await expect(controller.list('r1', 'p1', 't1')).resolves.toHaveLength(1);
    expect(list.execute).toHaveBeenCalledWith({ roomId: 'r1', problemId: 'p1', tutorId: 't1' });
    await expect(controller.getById('r1', 'p1', 'sess1', 't1')).resolves.toMatchObject({
      id: 'sess1',
      problemaId: 'p1',
      salaId: 'r1',
    });
    expect(get.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      sessionId: 'sess1',
      tutorId: 't1',
    });

    await controller.update(
      'r1',
      'p1',
      'sess1',
      {
        titulo: 'Sessão alterada',
        descricao: null,
        data: '16-10-2026',
      },
      't1',
    );
    expect(update.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      sessionId: 'sess1',
      tutorId: 't1',
      title: 'Sessão alterada',
      description: null,
      date: '2026-10-16',
    });
  });

  it('returns deletion impact and delegates session deletion', async () => {
    const impact = {
      execute: jest.fn().mockResolvedValue({
        canDelete: true,
        rollCall: 0,
        roles: 0,
        observations: 0,
        evaluations: 0,
        feedbacks: 0,
        generalEvaluation: 0,
      }),
    };
    const remove = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new SessionsController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      impact as never,
      remove as never,
    );

    await expect(controller.getImpact('r1', 'p1', 'sess1', 't1')).resolves.toEqual({
      podeExcluir: true,
      chamada: 0,
      papeis: 0,
      observacoes: 0,
      avaliacoes: 0,
      feedbacks: 0,
      avaliacaoGeral: 0,
    });
    expect(impact.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      sessionId: 'sess1',
      tutorId: 't1',
    });
    await expect(controller.delete('r1', 'p1', 'sess1', 't1')).resolves.toBeUndefined();
    expect(remove.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      problemId: 'p1',
      sessionId: 'sess1',
      tutorId: 't1',
    });
  });
});
