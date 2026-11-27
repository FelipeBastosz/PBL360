import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';
import {
  hasRoomStudent,
  hasRoomTutor,
  listRoomTutors,
  removeRoomStudent,
} from './room-member-queries';

describe('room member queries', () => {
  it('checks student and tutor membership and handles missing rows', async () => {
    const query = jest.fn().mockResolvedValue([{ exists: true }]);
    const rooms = { query } as unknown as Repository<Room>;
    await expect(hasRoomStudent(rooms, 'r1', 's1')).resolves.toBe(true);
    query.mockResolvedValueOnce([]);
    await expect(hasRoomStudent(rooms, 'r1', 's2')).resolves.toBe(false);
    query.mockResolvedValueOnce([{ exists: true }]);
    await expect(hasRoomTutor(rooms, 'r1', 't1')).resolves.toBe(true);
    query.mockResolvedValueOnce([]);
    await expect(hasRoomTutor(rooms, 'r1', 't2')).resolves.toBe(false);
  });

  it('removes students when a row is returned and returns false otherwise', async () => {
    const query = jest.fn().mockResolvedValue([[{ student_id: 's1' }, 1]]);
    const rooms = { query } as unknown as Repository<Room>;
    await expect(removeRoomStudent(rooms, 'r1', 's1')).resolves.toBe(true);
    query.mockResolvedValueOnce([[], 0]);
    await expect(removeRoomStudent(rooms, 'r1', 's2')).resolves.toBe(false);
  });

  it('lists tutors with the requested room id', async () => {
    const tutors = [{ id: 't1', name: 'Ana', email: 'ana@example.test', isResponsible: true }];
    const query = jest.fn().mockResolvedValue(tutors);
    await expect(listRoomTutors({ query } as unknown as Repository<Room>, 'r1')).resolves.toBe(
      tutors,
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('room_tutors'), ['r1']);
  });
});
