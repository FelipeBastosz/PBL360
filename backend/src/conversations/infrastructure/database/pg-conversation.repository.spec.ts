import { Conversation } from '../../domain/entities/conversation.entity';
import { PgConversationRepository } from './pg-conversation.repository';

describe('PgConversationRepository', () => {
  const conversation = { id: 'c1', roomId: 'r1', tutorId: 't1', studentId: 's1' } as Conversation;
  const setup = () => {
    const findOne = jest.fn();
    const getRepository = jest.fn().mockReturnValue({ findOne });
    const query = jest.fn();
    const repository = new PgConversationRepository({ getRepository, query } as never);
    return { repository, findOne, getRepository, query };
  };

  it('loads conversations by id and by room, tutor and student', async () => {
    const { repository, findOne, getRepository } = setup();
    findOne.mockResolvedValueOnce(conversation).mockResolvedValueOnce(null);

    await expect(repository.findById('c1')).resolves.toBe(conversation);
    expect(getRepository).toHaveBeenCalledWith(Conversation);
    expect(findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 'c1' },
      relations: ['tutor', 'student', 'room'],
    });
    await expect(repository.findByRoomTutorAndStudent('r1', 't1', 's1')).resolves.toBeNull();
    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: { roomId: 'r1', tutorId: 't1', studentId: 's1' },
      relations: ['tutor', 'student', 'room'],
    });
  });

  it('returns an existing conversation or inserts a new one', async () => {
    const existing = setup();
    existing.findOne.mockResolvedValueOnce(conversation);
    await expect(existing.repository.findOrCreate('r1', 't1', 's1')).resolves.toEqual({
      conversation,
      created: false,
    });
    expect(existing.query).not.toHaveBeenCalled();

    const created = setup();
    created.findOne.mockResolvedValueOnce(null);
    created.query.mockResolvedValueOnce([conversation]);
    await expect(created.repository.findOrCreate('r1', 't1', 's1')).resolves.toEqual({
      conversation,
      created: true,
    });
    expect(created.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO conversations'),
      ['r1', 't1', 's1'],
    );
  });

  it('reads after an insertion conflict and errors if no conversation can be found', async () => {
    const conflicted = setup();
    conflicted.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(conversation);
    conflicted.query.mockResolvedValueOnce([]);
    await expect(conflicted.repository.findOrCreate('r1', 't1', 's1')).resolves.toEqual({
      conversation,
      created: false,
    });

    const missing = setup();
    missing.findOne.mockResolvedValue(null);
    missing.query.mockResolvedValueOnce([]);
    await expect(missing.repository.findOrCreate('r1', 't1', 's1')).rejects.toThrow(
      'Falha ao obter ou criar conversa.',
    );
  });

  it('maps conversation list rows with and without a last message', async () => {
    const { repository, query } = setup();
    query.mockResolvedValueOnce([
      {
        id: 'c1',
        interlocutorId: 's1',
        interlocutorName: 'Aluno',
        interlocutorType: 'STUDENT',
        interlocutorHasPhoto: 1,
        lastMessageText: 'Oi',
        lastMessageSentAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c2',
        interlocutorId: 's2',
        interlocutorName: 'Bia',
        interlocutorType: 'STUDENT',
        interlocutorHasPhoto: false,
        lastMessageText: null,
        lastMessageSentAt: null,
      },
    ]);

    await expect(repository.listByRoomAndUser('r1', 't1')).resolves.toEqual([
      {
        id: 'c1',
        interlocutor: { id: 's1', name: 'Aluno', type: 'STUDENT', hasPhoto: true },
        lastMessage: { text: 'Oi', sentAt: new Date('2026-01-01T00:00:00Z') },
      },
      {
        id: 'c2',
        interlocutor: { id: 's2', name: 'Bia', type: 'STUDENT', hasPhoto: false },
        lastMessage: null,
      },
    ]);
  });
});
