/* eslint-disable @typescript-eslint/unbound-method */

import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { ListRoomsUseCase } from './list-rooms.use-case';

describe('ListRoomsUseCase', () => {
  let sut: ListRoomsUseCase;
  let roomRepository: jest.Mocked<RoomRepository>;
  let mockRoom: Room;

  beforeEach(() => {
    roomRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseCode: jest.fn(),
      findByRoomCode: jest.fn(),
      findByTutorId: jest.fn(),
      update: jest.fn(),
      addTutor: jest.fn(),
      hasTutor: jest.fn(),
      removeTutor: jest.fn(),
    };

    sut = new ListRoomsUseCase(roomRepository);

    mockRoom = new Room();
    mockRoom.id = 'room-123';
    mockRoom.tutorId = 'tutor-123';
    mockRoom.name = 'Engenharia de Software';
    mockRoom.courseCode = 'EXA123';
    mockRoom.roomCode = 'aB7kP2x9';
    mockRoom.semester = '2026.2';
    mockRoom.active = true;
    mockRoom.createdAt = new Date('2026-09-24T12:00:00.000Z');
  });

  it('deve buscar as salas do professor informado', async () => {
    roomRepository.findByTutorId.mockResolvedValue([mockRoom]);

    await sut.execute('tutor-123');

    expect(roomRepository.findByTutorId).toHaveBeenCalledWith('tutor-123');
    expect(roomRepository.findByTutorId).toHaveBeenCalledTimes(1);
  });

  it('deve retornar os dados das salas vinculadas ao professor', async () => {
    roomRepository.findByTutorId.mockResolvedValue([mockRoom]);

    const result = await sut.execute('tutor-123');

    expect(result).toEqual([
      {
        id: 'room-123',
        name: 'Engenharia de Software',
        courseCode: 'EXA123',
        semester: '2026.2',
        active: true,
        createdAt: new Date('2026-09-24T12:00:00.000Z'),
      },
    ]);
  });

  it('deve retornar um array vazio quando o professor não possuir salas', async () => {
    roomRepository.findByTutorId.mockResolvedValue([]);

    const result = await sut.execute('tutor-sem-salas');

    expect(roomRepository.findByTutorId).toHaveBeenCalledWith('tutor-sem-salas');
    expect(result).toEqual([]);
  });

  it('não deve retornar o código de ingresso da sala na listagem', async () => {
    roomRepository.findByTutorId.mockResolvedValue([mockRoom]);

    const result = await sut.execute('tutor-123');

    expect(result[0]).not.toHaveProperty('roomCode');
  });

  it('deve retornar todas as salas recebidas do repositório', async () => {
    const secondRoom = new Room();
    secondRoom.id = 'room-456';
    secondRoom.name = 'Circuitos Digitais';
    secondRoom.courseCode = 'EXA456';
    secondRoom.semester = '2026.2';
    secondRoom.active = true;
    secondRoom.createdAt = new Date('2026-09-24T13:00:00.000Z');

    roomRepository.findByTutorId.mockResolvedValue([mockRoom, secondRoom]);

    const result = await sut.execute('tutor-123');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('room-123');
    expect(result[1].id).toBe('room-456');
  });
});
