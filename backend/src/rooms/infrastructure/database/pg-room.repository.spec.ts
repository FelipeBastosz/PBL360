import { QueryFailedError } from 'typeorm';
import {
  hasRoomStudent,
  hasRoomTutor,
  listRoomTutors,
  removeRoomStudent,
} from './room-member-queries';
import { listRoomStudents, queryStudentRooms } from './room-student-queries';
import { executeTransferRoomOwnership } from './room-ownership-queries';
import { fetchTutorSummary } from './room-row';
import { PgRoomRepository } from './pg-room.repository';

jest.mock('./room-member-queries', () => ({
  hasRoomStudent: jest.fn(),
  hasRoomTutor: jest.fn(),
  listRoomTutors: jest.fn(),
  removeRoomStudent: jest.fn(),
}));
jest.mock('./room-student-queries', () => ({
  listRoomStudents: jest.fn(),
  queryStudentRooms: jest.fn(),
}));
jest.mock('./room-ownership-queries', () => ({ executeTransferRoomOwnership: jest.fn() }));
jest.mock('./room-row', () => ({
  ROOM_COLUMNS: 'room columns',
  ROOM_WITH_TUTOR_COLUMNS: 'room columns with tutor',
  toRoomEntity: (_repository: unknown, row: unknown) => row,
  fetchTutorSummary: jest.fn(),
}));

describe('PgRoomRepository', () => {
  const room = {
    id: 'room-1',
    tutorId: 'tutor-1',
    name: 'Turma',
    courseCode: 'EXA',
    roomCode: 'ABC123',
    semester: '2026.1',
    active: true,
    createdAt: new Date(),
    deletedAt: null,
  };
  beforeEach(() => jest.clearAllMocks());

  it('creates a room, links its owner, fetches tutor details and maps unique code errors', async () => {
    const manager = {
      query: jest
        .fn()
        .mockResolvedValueOnce([room])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'Docente', email: 'teacher@example.com' }]),
    };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const rooms = {
      manager: { transaction },
      create: jest.fn((row: unknown) => row),
      query: jest.fn(),
    };
    const repository = new PgRoomRepository(rooms as never);

    await expect(repository.create(room as never)).resolves.toMatchObject({ id: 'room-1' });
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO room_tutors'), [
      'room-1',
      'tutor-1',
    ]);
    expect(fetchTutorSummary).toHaveBeenCalledWith(manager, 'tutor-1');

    const duplicate = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_rooms_room_code',
    });
    const conflictRepo = new PgRoomRepository({
      manager: { transaction: jest.fn().mockRejectedValue(duplicate) },
    } as never);
    await expect(conflictRepo.create({ ...room, roomCode: 'ABC123' } as never)).rejects.toThrow(
      'ABC123',
    );
  });

  it('queries rooms, joins students, and lists tutor summaries', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([room])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...room, totalStudents: 4, totalProblems: 2 }]);
    const repository = new PgRoomRepository({
      query,
      create: jest.fn((value: unknown) => value),
    } as never);

    await expect(repository.findById('room-1')).resolves.toMatchObject({ id: 'room-1' });
    await expect(repository.findByRoomCode('missing')).resolves.toBeNull();
    await repository.joinStudent('room-1', 'student-1');
    await expect(repository.findByTutorId('tutor-1')).resolves.toMatchObject([
      { room: { id: 'room-1' }, totalStudents: 4, totalProblems: 2 },
    ]);
  });

  it('updates and soft-deletes a room, mapping tutor identity', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([[room], 1])
      .mockResolvedValueOnce([]);
    const repository = new PgRoomRepository({
      query,
      create: jest.fn((value: unknown) => value),
    } as never);
    jest
      .mocked(fetchTutorSummary)
      .mockResolvedValue({ name: 'Docente', email: 'teacher@example.com' });

    await expect(repository.update(room as never)).resolves.toMatchObject({
      id: 'room-1',
      tutorName: 'Docente',
    });
    expect(fetchTutorSummary).toHaveBeenCalledWith(expect.anything(), 'tutor-1');
    await repository.softDelete({ ...room, deletedAt: new Date() } as never);
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), ['room-1', expect.any(Date)]);
  });

  it('delegates tutor and student membership operations', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ room_id: 'room-1' }])
      .mockResolvedValueOnce([[], 0]);
    const repository = new PgRoomRepository({
      query,
      create: jest.fn((value: unknown) => value),
      manager: { transaction: jest.fn() },
    } as never);
    jest.mocked(hasRoomTutor).mockResolvedValue(true);
    jest.mocked(hasRoomStudent).mockResolvedValue(false);
    jest.mocked(listRoomTutors).mockResolvedValue([]);
    jest.mocked(removeRoomStudent).mockResolvedValue(true);
    jest.mocked(listRoomStudents).mockResolvedValue([]);
    jest.mocked(queryStudentRooms).mockResolvedValue([]);

    await expect(repository.addTutor('room-1', 'tutor-2')).resolves.toBe(true);
    await expect(repository.removeTutor('room-1', 'tutor-2')).resolves.toBe(false);
    await expect(repository.hasTutor('room-1', 'tutor-2')).resolves.toBe(true);
    await expect(repository.hasStudent('room-1', 'student-1')).resolves.toBe(false);
    await expect(repository.listTutors('room-1')).resolves.toEqual([]);
    await expect(repository.removeStudent('room-1', 'student-1')).resolves.toBe(true);
    await expect(repository.findForStudent('student-1')).resolves.toEqual([]);
    await expect(repository.findStudents('room-1')).resolves.toEqual([]);
  });

  it('transfers ownership in a transaction', async () => {
    const manager = { query: jest.fn() };
    const transaction = jest.fn((work: (tx: typeof manager) => unknown) => work(manager));
    const repository = new PgRoomRepository({ manager: { transaction } } as never);
    const input = {
      roomId: 'room-1',
      expectedOwnerId: 'tutor-1',
      newOwnerId: 'tutor-2',
      transferredById: 'tutor-1',
    };
    jest
      .mocked(executeTransferRoomOwnership)
      .mockResolvedValue({ status: 'transferred', roomId: 'room-1', ownerId: 'tutor-2' });

    await expect(repository.transferOwnership(input)).resolves.toEqual({
      status: 'transferred',
      roomId: 'room-1',
      ownerId: 'tutor-2',
    });
    expect(executeTransferRoomOwnership).toHaveBeenCalledWith(manager, input);
  });
});
