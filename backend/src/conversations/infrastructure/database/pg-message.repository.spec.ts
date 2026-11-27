import { Message } from '../../domain/entities/message.entity';
import { PgMessageRepository } from './pg-message.repository';

describe('PgMessageRepository', () => {
  const row = (id: string, sentAt = '2026-01-01T00:00:00Z') => ({
    id,
    conversationId: 'c1',
    senderId: 'u1',
    text: `msg-${id}`,
    sentAt,
    senderName: 'Tutor',
  });
  const setup = () => {
    const findOne = jest.fn();
    const getRepository = jest.fn().mockReturnValue({ findOne });
    const query = jest.fn();
    const repository = new PgMessageRepository({ getRepository, query } as never);
    return { repository, findOne, getRepository, query };
  };

  it('finds a message with its sender relation', async () => {
    const message = new Message();
    const { repository, findOne, getRepository } = setup();
    findOne.mockResolvedValue(message);

    await expect(repository.findById('m1')).resolves.toBe(message);
    expect(getRepository).toHaveBeenCalledWith(Message);
    expect(findOne).toHaveBeenCalledWith({ where: { id: 'm1' }, relations: ['sender'] });
  });

  it('creates and maps a message or throws when insert returns no row', async () => {
    const { repository, query } = setup();
    query.mockResolvedValueOnce([row('m1')]).mockResolvedValueOnce([]);

    const message = await repository.create('c1', 'u1', 'texto');
    expect(message).toMatchObject({
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      text: 'msg-m1',
      sender: { name: 'Tutor' },
    });
    expect(message.sentAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('WITH inserted AS'), [
      'c1',
      'u1',
      'texto',
    ]);
    await expect(repository.create('c1', 'u1', 'texto')).rejects.toThrow(
      'Falha ao gravar mensagem.',
    );
  });

  it('lists messages after an id in ascending order without a next cursor', async () => {
    const { repository, query } = setup();
    query.mockResolvedValueOnce([row('m2'), row('m3')]);

    await expect(
      repository.listByConversation('c1', { afterId: 'm1', limit: 2 }),
    ).resolves.toMatchObject({
      messages: [{ id: 'm2' }, { id: 'm3' }],
      nextCursor: null,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('> ('), ['c1', 'm1', 2]);
  });

  it('paginates older cursor results and latest results in chronological order', async () => {
    const { repository, query } = setup();
    query.mockResolvedValueOnce([row('m3'), row('m2'), row('m1')]);
    await expect(
      repository.listByConversation('c1', { cursor: 'm4', limit: 2 }),
    ).resolves.toMatchObject({
      messages: [{ id: 'm2' }, { id: 'm3' }],
      nextCursor: 'm2',
    });
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('< ('), ['c1', 'm4', 3]);

    query.mockResolvedValueOnce([row('m3'), row('m2')]);
    await expect(repository.listByConversation('c1', { limit: 1 })).resolves.toMatchObject({
      messages: [{ id: 'm3' }],
      nextCursor: 'm3',
    });
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY m.sent_at DESC'), [
      'c1',
      2,
    ]);
  });
});
