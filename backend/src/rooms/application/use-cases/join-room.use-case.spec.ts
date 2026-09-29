import { NotFoundError } from '@/shared/errors/application.error';
import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { JoinRoomUseCase } from './join-room.use-case';

const createRoom = (): Room =>
  Room.create({
    tutorId: 'tutor-id',
    name: 'Software Engineering',
    courseCode: 'EXA123',
    roomCode: 'Ab12Cd34',
    semester: '2026.2',
  });

describe('JoinRoomUseCase', () => {
  let rooms: jest.Mocked<RoomRepository>;
  let useCase: JoinRoomUseCase;

  beforeEach(() => {
    rooms = {
      findByRoomCode: jest.fn(),
      joinStudent: jest.fn(),
    } as unknown as jest.Mocked<RoomRepository>;
    useCase = new JoinRoomUseCase(rooms);
  });

  it('enrolls a student in an active room found by code', async () => {
    const room = createRoom();
    rooms.findByRoomCode.mockResolvedValue(room);

    await useCase.execute({ roomCode: ' Ab12Cd34 ', studentId: 'student-id' });

    expect(rooms.findByRoomCode).toHaveBeenCalledWith('Ab12Cd34');
    expect(rooms.joinStudent).toHaveBeenCalledWith(room.id, 'student-id');
  });

  it('rejects unknown or inactive rooms with the same response', async () => {
    rooms.findByRoomCode.mockResolvedValue(null);

    await expect(useCase.execute({ roomCode: 'invalid', studentId: 'student-id' })).rejects.toThrow(
      new NotFoundError('Código de ingresso inválido ou sala indisponível.'),
    );

    const inactiveRoom = createRoom();
    inactiveRoom.active = false;
    rooms.findByRoomCode.mockResolvedValue(inactiveRoom);

    await expect(
      useCase.execute({ roomCode: 'Ab12Cd34', studentId: 'student-id' }),
    ).rejects.toThrow(new NotFoundError('Código de ingresso inválido ou sala indisponível.'));
    expect(rooms.joinStudent).not.toHaveBeenCalled();
  });
});
