import type { EntityManager, Repository } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import type { Room } from '../../domain/entities/room.entity';
import { fetchTutorSummary, toRoomEntity, type RoomRow } from './room-row';

describe('room row helpers', () => {
  it('fetches a tutor summary or returns undefined when no tutor is found', async () => {
    const query = jest
      .fn<EntityManager['query']>()
      .mockResolvedValue([{ name: 'Ana', email: 'ana@example.test' }]);
    await expect(fetchTutorSummary({ query }, 't1')).resolves.toEqual({
      name: 'Ana',
      email: 'ana@example.test',
    });
    query.mockResolvedValue([]);
    await expect(fetchTutorSummary({ query }, 'missing')).resolves.toBeUndefined();
  });

  it('creates a room with an optional tutor summary', () => {
    const create = jest.fn((row: unknown) => row as Room);
    const repository = { create } as unknown as Repository<Room>;
    const row: RoomRow = {
      id: 'r1',
      tutorId: 't1',
      name: 'Turma',
      courseCode: 'EXA',
      roomCode: 'ABC123',
      semester: '2026.1',
      active: true,
      createdAt: new Date(),
      deletedAt: null,
      tutorName: 'Ana',
    };

    const withTutor = toRoomEntity(repository, row);
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('tutorName');
    expect(withTutor.tutor).toBeInstanceOf(User);
    expect(withTutor.tutor).toMatchObject({ id: 't1', name: 'Ana', email: '' });

    const withoutTutor = toRoomEntity(repository, { ...row, tutorName: undefined });
    expect(withoutTutor.tutor).toBeUndefined();
    expect(
      toRoomEntity(repository, { ...row, tutorId: '', tutorName: 'Ana' }).tutor,
    ).toBeUndefined();
  });
});
