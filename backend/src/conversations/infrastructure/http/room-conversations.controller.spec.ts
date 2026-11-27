import { UserType } from '@/users/domain/enums/user-type.enum';
import { RoomConversationsController } from './room-conversations.controller';

describe('RoomConversationsController', () => {
  const user = { id: 's1', type: UserType.STUDENT };

  it('lists room conversations with the authenticated user context', async () => {
    const list = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 'c1',
          interlocutor: { id: 't1', name: 'Tutor', type: UserType.TUTOR, hasPhoto: true },
          lastMessage: null,
        },
      ]),
    };
    const create = { execute: jest.fn() };
    const controller = new RoomConversationsController(list as never, create as never);
    await expect(controller.list('r1', user)).resolves.toEqual([
      {
        id: 'c1',
        interlocutor: { id: 't1', nome: 'Tutor', tipo: 'PROFESSOR', possuiFoto: true },
        ultimaMensagem: null,
      },
    ]);
    expect(list.execute).toHaveBeenCalledWith({ roomId: 'r1', authenticatedUser: user });
  });

  it.each([
    { created: true, status: 201 },
    { created: false, status: 200 },
  ])('sets response status $status for created=$created', async ({ created, status }) => {
    const result = {
      created,
      conversation: { id: 'c1' },
      interlocutor: { id: 't1', name: 'Tutor', type: UserType.TUTOR, hasPhoto: false },
    };
    const create = { execute: jest.fn().mockResolvedValue(result) };
    const controller = new RoomConversationsController(
      { execute: jest.fn() } as never,
      create as never,
    );
    const response = { status: jest.fn() };
    await expect(
      controller.createOrGet('r1', { destinatarioId: 't1' }, user, response as never),
    ).resolves.toEqual({
      id: 'c1',
      interlocutor: { id: 't1', nome: 'Tutor', tipo: 'PROFESSOR', possuiFoto: false },
    });
    expect(response.status).toHaveBeenCalledWith(status);
    expect(create.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      authenticatedUser: user,
      recipientId: 't1',
    });
  });
});
