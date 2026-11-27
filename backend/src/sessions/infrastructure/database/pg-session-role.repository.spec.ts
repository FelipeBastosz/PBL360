import { SessionRole } from '../../domain/enums/session-role.enum';
import { PgSessionRoleRepository } from './pg-session-role.repository';

describe('PgSessionRoleRepository', () => {
  it('lists role assignments and removes empty batches without querying', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([
        { studentId: 'student-1', name: 'Ana', role: SessionRole.COORDINATOR, roleScore: '8' },
      ]);
    const repository = new PgSessionRoleRepository({
      query,
      manager: { transaction: jest.fn() },
    } as never);

    await expect(repository.list('session-1')).resolves.toEqual([
      { studentId: 'student-1', name: 'Ana', role: SessionRole.COORDINATOR, roleScore: '8' },
    ]);
    await repository.removeForStudents('session-1', []);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('assigns a role to an enrolled student and removes a role when null is requested', async () => {
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce([{ studentId: 'student-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ studentId: 'student-2' }])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgSessionRoleRepository({
      query: jest.fn(),
      manager: { transaction },
    } as never);

    await expect(
      repository.assign('session-1', 'room-1', 'student-1', SessionRole.COORDINATOR, 8, false),
    ).resolves.toEqual({
      studentId: 'student-1',
      role: SessionRole.COORDINATOR,
      roleScore: 8,
    });
    await expect(
      repository.assign('session-1', 'room-1', 'student-2', null, null, false),
    ).resolves.toEqual({
      studentId: 'student-2',
      role: null,
      roleScore: null,
    });
    expect(managerQuery).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [
      'session-1',
      'student-1',
      SessionRole.COORDINATOR,
      8,
    ]);
  });

  it('rejects students not enrolled and refuses occupied role unless transfer is requested', async () => {
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ studentId: 'student-1' }])
      .mockResolvedValueOnce([{ studentId: 'other-student', name: 'Bia' }])
      .mockResolvedValueOnce([{ studentId: 'student-1' }])
      .mockResolvedValueOnce([{ studentId: 'other-student', name: 'Bia' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgSessionRoleRepository({
      query: jest.fn(),
      manager: { transaction },
    } as never);

    await expect(
      repository.assign('session-1', 'room-1', 'student-1', SessionRole.COORDINATOR, null, false),
    ).rejects.toThrow('O aluno não está matriculado na sala.');
    await expect(
      repository.assign('session-1', 'room-1', 'student-1', SessionRole.COORDINATOR, null, false),
    ).rejects.toThrow('O papel já está ocupado.');
    await expect(
      repository.assign('session-1', 'room-1', 'student-1', SessionRole.COORDINATOR, null, true),
    ).resolves.toMatchObject({
      studentId: 'student-1',
      role: SessionRole.COORDINATOR,
    });
    expect(
      managerQuery.mock.calls.some(([sql]: [string]) =>
        sql.includes('DELETE FROM session_roles WHERE session_id = $1 AND role = $2'),
      ),
    ).toBe(true);
  });

  it('removes assignments for a nonempty list and supports assigning the already-held role', async () => {
    const query = jest.fn();
    const managerQuery = jest
      .fn()
      .mockResolvedValueOnce([{ studentId: 'student-1' }])
      .mockResolvedValueOnce([{ studentId: 'student-1', name: 'Ana' }])
      .mockResolvedValueOnce([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgSessionRoleRepository({ query, manager: { transaction } } as never);

    await repository.removeForStudents('session-1', ['student-1']);
    await expect(
      repository.assign(
        'session-1',
        'room-1',
        'student-1',
        SessionRole.TABLE_SECRETARY,
        null,
        false,
      ),
    ).resolves.toMatchObject({
      role: SessionRole.TABLE_SECRETARY,
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ANY($2::uuid[])'), [
      'session-1',
      ['student-1'],
    ]);
  });
});
