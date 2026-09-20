import type { Room } from '../../domain/entities/room.entity';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { CreateRoomUseCase } from './create-room.use-case';

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
});
