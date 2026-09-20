import { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { CreateRoomUseCase } from './create-room.use-case';

function createRoomRepositoryMock() {
  const saveMock = jest.fn((room: Room) => Promise.resolve(room));
  const findByCodeMock = jest.fn().mockResolvedValue(null);
  const findByAccessTokenMock = jest.fn().mockResolvedValue(null);

  const rooms: jest.Mocked<RoomRepository> = {
    save: saveMock,
    findByCode: findByCodeMock,
    findByAccessToken: findByAccessTokenMock,
  };

  return {
    rooms,
    saveMock,
    findByCodeMock,
    findByAccessTokenMock,
  };
}

describe('CreateRoomUseCase', () => {
  it('creates and saves a room', async () => {
    const saveMock = jest.fn((room: Room) => Promise.resolve(room));

    const rooms: jest.Mocked<RoomRepository> = {
      save: saveMock,
      findByCode: jest.fn().mockResolvedValue(null),
      findByAccessToken: jest.fn().mockResolvedValue(null),
    };

    const useCase = new CreateRoomUseCase(rooms);

    const result = await useCase.execute({
      tutorId: 'tutor-123',
      name: 'Engenharia de Software',
      semester: '2026.2',
    });

    expect(result.name).toBe('Engenharia de Software');
    expect(result.active).toBe(true);
    expect(result.code).toMatch(/^[0-9A-F]{12}$/);
    expect(result.accessToken).toMatch(/^[0-9a-f]{32}$/);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('generates another code when the first one is taken', async () => {
    const { rooms, findByCodeMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala existente',
      code: 'ABC123',
      accessToken: 'existing-token',
      semester: '2026.2',
    });

    findByCodeMock.mockResolvedValueOnce(existingRoom);

    const useCase = new CreateRoomUseCase(rooms);

    await useCase.execute({
      tutorId: 'tutor-123',
      name: 'Engenharia de Software',
      semester: '2026.2',
    });

    expect(findByCodeMock).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('generates another access token when the first one is taken', async () => {
    const { rooms, findByAccessTokenMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala existente',
      code: 'ABC123',
      accessToken: 'existing-token',
      semester: '2026.2',
    });

    findByAccessTokenMock.mockResolvedValueOnce(existingRoom);

    const useCase = new CreateRoomUseCase(rooms);

    await useCase.execute({
      tutorId: 'tutor-123',
      name: 'Engenharia de Software',
      semester: '2026.2',
    });

    expect(findByAccessTokenMock).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('rejects creation after five code collisions', async () => {
    const { rooms, findByCodeMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala existente',
      code: 'ABC123',
      accessToken: 'existing-token',
      semester: '2026.2',
    });

    findByCodeMock.mockResolvedValue(existingRoom);

    const useCase = new CreateRoomUseCase(rooms);

    await expect(
      useCase.execute({
        tutorId: 'tutor-123',
        name: 'Engenharia de Software',
        semester: '2026.2',
      }),
    ).rejects.toThrow('Não foi possível gerar um código disponível.');

    expect(findByCodeMock).toHaveBeenCalledTimes(5);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('rejects creation after five access token collisions', async () => {
    const { rooms, findByAccessTokenMock, saveMock } = createRoomRepositoryMock();

    const existingRoom = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala existente',
      code: 'ABC123',
      accessToken: 'existing-token',
      semester: '2026.2',
    });

    findByAccessTokenMock.mockResolvedValue(existingRoom);

    const useCase = new CreateRoomUseCase(rooms);

    await expect(
      useCase.execute({
        tutorId: 'tutor-123',
        name: 'Engenharia de Software',
        semester: '2026.2',
      }),
    ).rejects.toThrow('Não foi possível gerar um token disponível.');

    expect(findByAccessTokenMock).toHaveBeenCalledTimes(5);
    expect(saveMock).not.toHaveBeenCalled();
  });
});
