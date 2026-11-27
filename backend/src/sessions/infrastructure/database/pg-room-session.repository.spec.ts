import { PgRoomSessionRepository } from './pg-room-session.repository';

describe('PgRoomSessionRepository', () => {
  it('lists room sessions together with their problem context', async () => {
    const sessions = [
      {
        id: 'sess1',
        title: 'Sessão',
        date: '2026-01-01',
        orderIndex: 1,
        status: 'PLANNED',
        problemId: 'p1',
        problemTitle: 'Problema',
      },
    ];
    const query = jest.fn().mockResolvedValue(sessions);
    const repository = new PgRoomSessionRepository({ query } as never);

    await expect(repository.findByRoom('r1')).resolves.toBe(sessions);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('JOIN problems p'), ['r1']);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY s.date DESC'), ['r1']);
  });
});
