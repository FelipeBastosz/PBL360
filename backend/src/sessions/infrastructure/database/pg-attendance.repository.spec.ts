import { QueryFailedError } from 'typeorm';
import { PgAttendanceRepository } from './pg-attendance.repository';

describe('PgAttendanceRepository', () => {
  it('lists enrolled students and maps string seat numbers', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'student-1', name: 'Ana' }])
      .mockResolvedValueOnce([
        {
          studentId: 'student-1',
          status: 'PRESENT',
          seatNumber: '3',
          justification: null,
          recordedAt: new Date(),
        },
        {
          studentId: 'student-2',
          status: 'ABSENT',
          seatNumber: null,
          justification: 'Motivo',
          recordedAt: new Date(),
        },
      ]);
    const repository = new PgAttendanceRepository({ query } as never);

    await expect(repository.findEnrolledStudents('room-1')).resolves.toEqual([
      { id: 'student-1', name: 'Ana' },
    ]);
    await expect(repository.findBySession('session-1')).resolves.toMatchObject([
      { studentId: 'student-1', seatNumber: 3 },
      { studentId: 'student-2', seatNumber: null },
    ]);
  });

  it('returns a previous roll call with entries, or null when none exists', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'previous', date: '2026-01-01' }])
      .mockResolvedValueOnce([
        {
          studentId: 'student-1',
          status: 'PRESENT',
          seatNumber: 1,
          justification: null,
          recordedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([]);
    const repository = new PgAttendanceRepository({ query } as never);

    await expect(
      repository.findPreviousRollCall('room-1', { id: 'session-2', date: '2026-01-02' }),
    ).resolves.toMatchObject({
      sessionId: 'previous',
      date: '2026-01-01',
      entries: [{ studentId: 'student-1' }],
    });
    await expect(
      repository.findPreviousRollCall('room-1', { id: 'session-1', date: '2026-01-01' }),
    ).resolves.toBeNull();
  });

  it('writes attendance batches in a transaction and maps duplicate seats to a conflict', async () => {
    const managerQuery = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgAttendanceRepository({ manager: { transaction } } as never);
    const entries = [
      { studentId: 'student-1', status: 'PRESENT', justification: null, seatNumber: 1 },
    ];

    await repository.saveBatch('session-1', 'teacher-1', entries as never);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(managerQuery).toHaveBeenCalledTimes(2);
    expect(managerQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
      'session-1',
      'teacher-1',
      ['student-1'],
      ['PRESENT'],
      [null],
      [1],
    ]);

    const duplicateSeat = new QueryFailedError('insert', [], {
      code: '23505',
      constraint: 'uq_attendances_session_seat',
    });
    const failedRepository = new PgAttendanceRepository({
      manager: { transaction: jest.fn().mockRejectedValue(duplicateSeat) },
    } as never);
    await expect(
      failedRepository.saveBatch('session-1', 'teacher-1', entries as never),
    ).rejects.toThrow('Dois alunos não podem ocupar o mesmo lugar na mesa.');
  });
});
