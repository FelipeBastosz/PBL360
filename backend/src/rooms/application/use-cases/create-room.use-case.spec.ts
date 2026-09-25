import type { Room } from '../../domain/entities/room.entity';
import { InvalidRoomError } from '../../domain/errors/invalid-room.error';
import { RoomCodeInUseError } from '../../domain/errors/room-code-in-use.error';
import { OWNER_ID, roomRepositoryStub } from '../../testing/room-fixtures';
import { CreateRoomUseCase, generateRoomCode } from './create-room.use-case';

const input = {
  tutorId: OWNER_ID,
  name: '  Engenharia de Software  ',
  courseCode: 'exa123',
  semester: '2026.2',
};

describe('CreateRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let useCase: CreateRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    rooms.create.mockImplementation((room: Room) => Promise.resolve(room));
    useCase = new CreateRoomUseCase(rooms);
  });

  it('creates the room owned by the given tutor with normalized data', async () => {
    const room = await useCase.execute(input);

    expect(room).toMatchObject({
      tutorId: OWNER_ID,
      name: 'Engenharia de Software',
      courseCode: 'EXA123',
      semester: '2026.2',
      active: true,
    });
    expect(room.roomCode).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('tries a new room code when the generated one is already in use', async () => {
    rooms.create
      .mockRejectedValueOnce(new RoomCodeInUseError('taken'))
      .mockImplementationOnce((room: Room) => Promise.resolve(room));

    await useCase.execute(input);

    expect(rooms.create).toHaveBeenCalledTimes(2);
  });

  it('gives up after five collisions', async () => {
    rooms.create.mockRejectedValue(new RoomCodeInUseError('taken'));

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(RoomCodeInUseError);
    expect(rooms.create).toHaveBeenCalledTimes(5);
  });

  it('does not retry on other failures', async () => {
    rooms.create.mockRejectedValue(new Error('connection lost'));

    await expect(useCase.execute(input)).rejects.toThrow('connection lost');
    expect(rooms.create).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid room data before touching the repository', async () => {
    await expect(useCase.execute({ ...input, semester: '   ' })).rejects.toBeInstanceOf(
      InvalidRoomError,
    );
    expect(rooms.create).not.toHaveBeenCalled();
  });
});

describe('generateRoomCode', () => {
  it('produces 8 alphanumeric characters', () => {
    expect(generateRoomCode()).toMatch(/^[A-Za-z0-9]{8}$/);
  });
});
