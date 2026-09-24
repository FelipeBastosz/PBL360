import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { CreateRoomUseCase } from './create-room.use-case';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { InvalidRoomError } from '../../domain/errors/invalid-room.error';

const TUTOR_ID = '123e4567-e89b-42d3-a456-426614174000';

function createUser(type: UserType = UserType.TUTOR): User {
  const user = new User();

  user.id = TUTOR_ID;
  user.type = type;

  return user;
}

function createUserRepositoryMock(type: UserType = UserType.TUTOR) {
  const user = createUser(type);

  const findByIdMock = jest.fn().mockResolvedValue(user);

  const users: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn(),
    findById: findByIdMock,
    save: jest.fn(),
  };

  return {
    users,
    findByIdMock,
  };
}

function createRoomRepositoryMock() {
  const saveMock = jest.fn((room: Room) => Promise.resolve(room));
  const findByRoomCodeMock = jest.fn().mockResolvedValue(null);
  const findByCourseCodeMock = jest.fn().mockResolvedValue(null);
  const findByIdMock = jest.fn().mockResolvedValue(null);
  const updateMock = jest.fn().mockResolvedValue(undefined);

  const rooms: jest.Mocked<RoomRepository> = {
    save: saveMock,
    findByCourseCode: findByCourseCodeMock,
    findByRoomCode: findByRoomCodeMock,
    findById: findByIdMock,
    findByTutorId: jest.fn(),
    update: updateMock,
    addTutor: jest.fn().mockResolvedValue(undefined),
    hasTutor: jest.fn().mockResolvedValue(false),
    removeTutor: jest.fn().mockResolvedValue(undefined),
  };

  return {
    rooms,
    saveMock,
    findByRoomCodeMock,
    findByCourseCodeMock,
  };
}

describe('CreateRoomUseCase', () => {
  it('creates and saves a room with the informed code', async () => {
    const { rooms, saveMock, findByCourseCodeMock } = createRoomRepositoryMock();
    const { users } = createUserRepositoryMock();
    const useCase = new CreateRoomUseCase(rooms, users);
    const result = await useCase.execute({
      tutorId: TUTOR_ID,
      name: 'Engenharia de Software',
      courseCode: 'EXA123',
      semester: '2026.2',
    });

    expect(result.name).toBe('Engenharia de Software');
    expect(result.active).toBe(true);
    expect(result.courseCode).toBe('EXA123');
    expect(result.roomCode).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(findByCourseCodeMock).not.toHaveBeenCalled();
  });

  it('normalizes the informed code to uppercase', async () => {
    const { rooms, saveMock } = createRoomRepositoryMock();
    const { users } = createUserRepositoryMock();
    const useCase = new CreateRoomUseCase(rooms, users);
    const result = await useCase.execute({
      tutorId: TUTOR_ID,
      name: 'Engenharia de Software',
      courseCode: 'exa123',
      semester: '2026.2',
    });

    expect(result.courseCode).toBe('EXA123');

    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('generates another room code when the first one is taken', async () => {
    const { rooms, findByRoomCodeMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: TUTOR_ID,
      name: 'Sala existente',
      courseCode: 'ABC123',
      roomCode: 'existing-room-code',
      semester: '2026.2',
    });

    findByRoomCodeMock.mockResolvedValueOnce(existingRoom);

    const { users } = createUserRepositoryMock();

    const useCase = new CreateRoomUseCase(rooms, users);

    const result = await useCase.execute({
      tutorId: TUTOR_ID,
      name: 'Engenharia de Software',
      courseCode: 'EXA123',
      semester: '2026.2',
    });

    expect(findByRoomCodeMock).toHaveBeenCalledTimes(2);
    expect(result.courseCode).toBe('EXA123');
    expect(result.roomCode).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('rejects creation after five access token collisions', async () => {
    const { rooms, findByRoomCodeMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: TUTOR_ID,
      name: 'Sala existente',
      courseCode: 'ABC123',
      roomCode: 'existing-room-code',
      semester: '2026.2',
    });

    findByRoomCodeMock.mockResolvedValue(existingRoom);

    const { users } = createUserRepositoryMock();

    const useCase = new CreateRoomUseCase(rooms, users);

    await expect(
      useCase.execute({
        tutorId: TUTOR_ID,
        name: 'Engenharia de Software',
        courseCode: 'EXA123',
        semester: '2026.2',
      }),
    ).rejects.toThrow('Não foi possível gerar um código de sala disponível.');

    expect(findByRoomCodeMock).toHaveBeenCalledTimes(5);

    expect(saveMock).not.toHaveBeenCalled();
  });

  it('rejects creation when tutor does not exist', async () => {
    const { rooms, saveMock, findByRoomCodeMock } = createRoomRepositoryMock();

    const { users, findByIdMock } = createUserRepositoryMock();

    findByIdMock.mockResolvedValue(null);

    const useCase = new CreateRoomUseCase(rooms, users);

    await expect(
      useCase.execute({
        tutorId: TUTOR_ID,
        name: 'Engenharia de Software',
        courseCode: 'EXA123',
        semester: '2026.2',
      }),
    ).rejects.toThrow(InvalidRoomError);

    expect(findByIdMock).toHaveBeenCalledWith(TUTOR_ID);
    expect(findByRoomCodeMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
