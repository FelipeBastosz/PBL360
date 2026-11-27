import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';
import { addRoomTutor, hasRoomTutor, removeRoomTutor } from './room-tutor-queries';

describe('room tutor queries', () => {
  it('adds, checks and removes a tutor when the database reports a change', async () => {
    const query = jest.fn().mockResolvedValue([{ changed: true }]);
    const rooms = { query } as unknown as Repository<Room>;
    await expect(addRoomTutor(rooms, 'r1', 't1', 'actor')).resolves.toBe(true);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO room_tutors'), [
      'r1',
      't1',
      'actor',
    ]);
    query.mockResolvedValueOnce([{ exists: true }]);
    await expect(hasRoomTutor(rooms, 'r1', 't1')).resolves.toBe(true);
    query.mockResolvedValueOnce([{ changed: true }]);
    await expect(removeRoomTutor(rooms, 'r1', 't1', 'actor')).resolves.toBe(true);
  });

  it('returns false when inserts, checks or deletes produce no result row', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const rooms = { query } as unknown as Repository<Room>;
    await expect(addRoomTutor(rooms, 'r1', 't1', 'actor')).resolves.toBe(false);
    await expect(hasRoomTutor(rooms, 'r1', 't1')).resolves.toBe(false);
    await expect(removeRoomTutor(rooms, 'r1', 't1', 'actor')).resolves.toBe(false);
  });
});
