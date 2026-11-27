import type { Repository } from 'typeorm';
import type { Room } from '../../domain/entities/room.entity';
import { hasRoomStudent, listRoomStudents, queryStudentRooms } from './room-student-queries';

describe('room student queries', () => {
  it('checks enrollment and lists room students', async () => {
    const rows = [{ id: 's1', name: 'Ana' }];
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ enrolled: true }])
      .mockResolvedValueOnce(rows);
    const rooms = { query } as unknown as Repository<Room>;
    await expect(hasRoomStudent(rooms, 'r1', 's1')).resolves.toBe(true);
    await expect(listRoomStudents(rooms, 'r1')).resolves.toBe(rows);
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('room_students'), ['r1']);
    query.mockResolvedValueOnce([]);
    await expect(hasRoomStudent(rooms, 'r1', 's2')).resolves.toBe(false);
  });

  it('maps student rooms with and without a tutor summary', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        roomId: 'r1',
        name: 'Sala',
        semester: '2026.1',
        totalStudents: 3,
        totalProblems: 2,
        tutorId: 't1',
        tutorName: 'Ana',
        tutorEmail: null,
      },
      {
        roomId: 'r2',
        name: 'Outra',
        semester: '2025.2',
        totalStudents: 1,
        totalProblems: 0,
        tutorId: null,
        tutorName: null,
        tutorEmail: null,
      },
    ]);
    await expect(
      queryStudentRooms({ query } as unknown as Repository<Room>, 's1'),
    ).resolves.toEqual([
      {
        roomId: 'r1',
        name: 'Sala',
        semester: '2026.1',
        totalStudents: 3,
        totalProblems: 2,
        tutor: { id: 't1', name: 'Ana', email: '' },
      },
      {
        roomId: 'r2',
        name: 'Outra',
        semester: '2025.2',
        totalStudents: 1,
        totalProblems: 0,
        tutor: undefined,
      },
    ]);
  });
});
