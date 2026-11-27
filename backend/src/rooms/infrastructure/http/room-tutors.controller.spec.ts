import { UserType } from '@/users/domain/enums/user-type.enum';
import { RoomTutorsController } from './room-tutors.controller';

describe('RoomTutorsController', () => {
  it('lists, adds and removes room tutors and transfers room ownership', async () => {
    const member = { id: 't1', type: UserType.TUTOR };
    const list = {
      execute: jest
        .fn()
        .mockResolvedValue([
          { id: 't1', name: 'Ana', email: 'ana@example.test', isResponsible: true },
        ]),
    };
    const add = { execute: jest.fn() };
    const remove = { execute: jest.fn() };
    const transfer = { execute: jest.fn().mockResolvedValue({ id: 'r1', tutorId: 't2' }) };
    const controller = new RoomTutorsController(
      list as never,
      add as never,
      remove as never,
      transfer as never,
    );

    await expect(controller.listTutors('r1', member)).resolves.toEqual([
      { id: 't1', nome: 'Ana', email: 'ana@example.test', responsavel: true },
    ]);
    expect(list.execute).toHaveBeenCalledWith({ roomId: 'r1', member });
    await expect(controller.addTutor('r1', { professorId: 't2' }, 't1')).resolves.toEqual({
      mensagem: 'Professor associado à sala com sucesso.',
    });
    expect(add.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      authenticatedTutorId: 't1',
      tutorId: 't2',
    });
    await expect(controller.removeTutor('r1', 't2', 't1')).resolves.toEqual({
      mensagem: 'Professor removido da sala com sucesso.',
    });
    expect(remove.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      authenticatedTutorId: 't1',
      tutorId: 't2',
    });
    await expect(controller.transferOwnership('r1', { professorId: 't2' }, 't1')).resolves.toEqual({
      id: 'r1',
      professorResponsavelId: 't2',
    });
    expect(transfer.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      authenticatedTutorId: 't1',
      newOwnerId: 't2',
    });
  });
});
