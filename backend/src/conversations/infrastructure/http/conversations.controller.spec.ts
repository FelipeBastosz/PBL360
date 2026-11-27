import { UserType } from '@/users/domain/enums/user-type.enum';
import { ConversationsController } from './conversations.controller';

describe('ConversationsController', () => {
  it('maps message history query and authenticated user', async () => {
    const sentAt = new Date('2025-01-01');
    const list = {
      execute: jest.fn().mockResolvedValue({
        messages: [{ id: 'm1', senderId: 's1', sender: { name: 'Ana' }, text: 'Oi', sentAt }],
        nextCursor: 'cursor-1',
      }),
    };
    const send = { execute: jest.fn() };
    const controller = new ConversationsController(list as never, send as never);
    await expect(
      controller.listMessages(
        'c1',
        { cursor: 'cursor-0', apos: 'm0', limite: 20 },
        {
          id: 't1',
          type: UserType.TUTOR,
        },
      ),
    ).resolves.toMatchObject({
      itens: [{ id: 'm1', remetente: { nome: 'Ana' } }],
      proximoCursor: 'cursor-1',
    });
    expect(list.execute).toHaveBeenCalledWith({
      conversationId: 'c1',
      authenticatedUser: { id: 't1', type: UserType.TUTOR },
      query: { cursor: 'cursor-0', afterId: 'm0', limit: 20 },
    });
  });

  it('sends a message for the authenticated account', async () => {
    const sentAt = new Date('2025-01-02');
    const send = {
      execute: jest.fn().mockResolvedValue({
        id: 'm2',
        senderId: 's1',
        sender: { name: 'Ana' },
        text: 'Olá',
        sentAt,
      }),
    };
    const controller = new ConversationsController({ execute: jest.fn() } as never, send as never);
    await expect(
      controller.send('c1', { texto: 'Olá' }, { id: 's1', type: UserType.STUDENT }),
    ).resolves.toMatchObject({ id: 'm2', texto: 'Olá', remetente: { id: 's1' } });
    expect(send.execute).toHaveBeenCalledWith({
      conversationId: 'c1',
      authenticatedUser: { id: 's1', type: UserType.STUDENT },
      text: 'Olá',
    });
  });
});
