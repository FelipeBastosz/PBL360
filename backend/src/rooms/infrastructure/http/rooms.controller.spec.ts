import { UserType } from '@/users/domain/enums/user-type.enum';
import { RoomsController } from './rooms.controller';

describe('RoomsController', () => {
  it('delegates room entry, queries room views, changes a room and leaves', async () => {
    const createdAt = new Date('2025-01-01');
    const room = {
      id: 'r1',
      tutorId: 't1',
      tutor: { id: 't1', name: 'Tutor', email: 't@example.test' },
      name: 'Turma',
      courseCode: 'EXA',
      roomCode: 'ABC12345',
      semester: '2025.1',
      active: true,
      createdAt,
    };
    const createRoom = { execute: jest.fn().mockResolvedValue(room) };
    const updateRoom = { execute: jest.fn().mockResolvedValue(room) };
    const deleteRoom = { execute: jest.fn().mockResolvedValue(undefined) };
    const listRooms = {
      execute: jest.fn().mockResolvedValue([{ room, totalStudents: 2, totalProblems: 3 }]),
    };
    const getRoom = { execute: jest.fn().mockResolvedValue(room) };
    const listStudentRooms = {
      execute: jest.fn().mockResolvedValue([
        {
          roomId: 'r1',
          name: 'Turma',
          semester: '2025.1',
          totalStudents: 2,
          totalProblems: 3,
          tutor: null,
        },
      ]),
    };
    const listRoomStudents = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 's1',
          name: 'Aluno',
          email: 's@example.test',
          registrationNumber: '123',
          joinedAt: createdAt,
        },
      ]),
    };
    const joinRoom = { execute: jest.fn().mockResolvedValue(undefined) };
    const leaveRoom = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new RoomsController(
      createRoom as never,
      updateRoom as never,
      deleteRoom as never,
      listRooms as never,
      getRoom as never,
      listStudentRooms as never,
      listRoomStudents as never,
      joinRoom as never,
      leaveRoom as never,
    );

    await expect(controller.joinByCode({ codigoSala: 'ABC12345' }, 's1')).resolves.toEqual({
      mensagem: 'Entrada na sala realizada com sucesso.',
    });
    expect(joinRoom.execute).toHaveBeenLastCalledWith({ roomCode: 'ABC12345', studentId: 's1' });
    await expect(
      controller.joinByLink({ link: 'https://pbl360.example.test/salas/ABC12345' }, 's1'),
    ).resolves.toEqual({ mensagem: 'Entrada na sala realizada com sucesso.' });
    expect(joinRoom.execute).toHaveBeenLastCalledWith({ roomCode: 'ABC12345', studentId: 's1' });

    await expect(controller.listStudentRooms('s1')).resolves.toMatchObject([
      { salaId: 'r1', totalAlunos: 2, totalProblemas: 3 },
    ]);
    await expect(
      controller.listRoomStudents('r1', { id: 't1', type: UserType.TUTOR }),
    ).resolves.toEqual([
      {
        id: 's1',
        nome: 'Aluno',
        email: 's@example.test',
        matricula: '123',
        dataEntrada: createdAt,
      },
    ]);
    await expect(controller.list('t1')).resolves.toMatchObject([
      { id: 'r1', nome: 'Turma', totalAlunos: 2 },
    ]);
    await expect(controller.getDetail('r1', 't1')).resolves.toMatchObject({
      id: 'r1',
      professorResponsavel: { id: 't1' },
    });
    await expect(
      controller.create({ nome: 'Turma', codigoDisciplina: 'EXA', semestre: '2025.1' }, 't1'),
    ).resolves.toMatchObject({ id: 'r1', codigoSala: 'ABC12345' });
    expect(createRoom.execute).toHaveBeenCalledWith({
      tutorId: 't1',
      name: 'Turma',
      courseCode: 'EXA',
      semester: '2025.1',
    });
    await expect(
      controller.edit('r1', { nome: 'Nova turma', ativo: false }, 't1'),
    ).resolves.toMatchObject({ id: 'r1' });
    expect(updateRoom.execute).toHaveBeenCalledWith({
      roomId: 'r1',
      tutorId: 't1',
      changes: { name: 'Nova turma', semester: undefined, active: false },
    });
    await expect(controller.delete('r1', 't1')).resolves.toBeUndefined();
    await expect(controller.leaveRoom('r1', 's1')).resolves.toBeUndefined();
    expect(deleteRoom.execute).toHaveBeenCalledWith({ roomId: 'r1', tutorId: 't1' });
    expect(leaveRoom.execute).toHaveBeenCalledWith({ roomId: 'r1', userId: 's1' });
  });

  it('rejects malformed invite links', () => {
    const noOp = { execute: jest.fn() };
    const controller = new RoomsController(
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
      noOp as never,
    );
    expect(() =>
      controller.joinByLink({ link: 'https://pbl360.example.test/invalid' }, 's1'),
    ).toThrow('O link de ingresso é inválido.');
  });
});
