import type { DataSource, EntityManager } from 'typeorm';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  updateSessionTable,
  type SessionConfigRow,
} from './session-table-configuration.persistence';

describe('updateSessionTable', () => {
  const current: SessionConfigRow = {
    id: 'session-1',
    problemId: 'problem-1',
    orderIndex: 1,
    title: 'Sessão 1',
  };

  it('blocks a table change when the current session has a submitted tutor evaluation', async () => {
    const manager = {
      query: jest.fn((sql: string) => {
        if (sql.includes('FROM performance_tables pt'))
          return Promise.resolve([{ id: 'table-2', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM performance_criteria')) return Promise.resolve([{ exists: true }]);
        if (sql.includes('INSERT INTO performance_tables'))
          return Promise.resolve([{ id: 'copied-table', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM sessions')) return Promise.resolve([current]);
        if (sql.includes('FROM evaluations')) return Promise.resolve([{ exists: true }]);
        return Promise.resolve([]);
      }),
    };
    const dataSource = {
      transaction: (work: (transactionManager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;

    await expect(
      updateSessionTable(dataSource, current, 'table-2', 'room-1', 'tutor-1', false),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(
      manager.query.mock.calls.some(([sql]) =>
        sql.includes('UPDATE sessions SET performance_table_id'),
      ),
    ).toBe(false);
  });

  it('records the explicit table choice and skips following submitted sessions', async () => {
    let submittedCheck = 0;
    const manager = {
      query: jest.fn((sql: string) => {
        if (sql.includes('FROM performance_tables pt'))
          return Promise.resolve([{ id: 'table-2', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM performance_criteria')) return Promise.resolve([{ exists: true }]);
        if (sql.includes('INSERT INTO performance_tables'))
          return Promise.resolve([{ id: 'copied-table', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM sessions')) {
          return Promise.resolve([
            current,
            { id: 'session-2', problemId: 'problem-1', orderIndex: 2, title: 'Sessão 2' },
          ]);
        }
        if (sql.includes('FROM evaluations')) {
          submittedCheck += 1;
          return Promise.resolve([{ exists: submittedCheck === 3 }]);
        }
        if (sql.includes('FROM session_evaluation_configs'))
          return Promise.resolve([{ exists: true }]);
        return Promise.resolve([]);
      }),
    };
    const dataSource = {
      transaction: (work: (transactionManager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;

    await expect(
      updateSessionTable(dataSource, current, 'table-2', 'room-1', 'tutor-1', true),
    ).resolves.toEqual({
      sessoesAtualizadas: [{ sessaoId: 'session-1', rotulo: 'Sessão 1' }],
      sessoesIgnoradas: [
        { sessaoId: 'session-2', rotulo: 'Sessão 2', motivo: 'AVALIACAO_ENVIADA' },
      ],
    });
    expect(manager.query).toHaveBeenCalledWith(
      'UPDATE sessions SET performance_table_id = $2, uses_default_table = FALSE WHERE id = $1;',
      ['session-1', 'copied-table'],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE session_evaluation_configs'),
      ['session-1', 'copied-table', 'Nova tabela'],
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE evaluations SET performance_table_id'),
      ['session-1', 'copied-table'],
    );
  });

  it('rejects a table that is not visible to the room', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) };
    const dataSource = {
      transaction: (work: (transactionManager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;

    await expect(
      updateSessionTable(dataSource, current, 'missing-table', 'room-1', 'tutor-1', false),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('rejects a visible table without active criteria', async () => {
    const manager = {
      query: jest.fn((sql: string) => {
        if (sql.includes('FROM performance_tables pt'))
          return Promise.resolve([{ id: 'table-2', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM performance_criteria')) return Promise.resolve([]);
        return Promise.resolve([]);
      }),
    };
    const dataSource = {
      transaction: (work: (transactionManager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;

    await expect(
      updateSessionTable(dataSource, current, 'table-2', 'room-1', 'tutor-1', false),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('updates the session table without rebuilding a missing evaluation snapshot', async () => {
    let submittedChecks = 0;
    const manager = {
      query: jest.fn((sql: string) => {
        if (sql.includes('FROM performance_tables pt'))
          return Promise.resolve([{ id: 'table-2', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM performance_criteria')) return Promise.resolve([{ exists: true }]);
        if (sql.includes('INSERT INTO performance_tables'))
          return Promise.resolve([{ id: 'copied-table', name: 'Nova tabela', isDefault: false }]);
        if (sql.includes('FROM sessions')) return Promise.resolve([current]);
        if (sql.includes('FROM evaluations')) {
          submittedChecks += 1;
          return Promise.resolve([{ exists: false }]);
        }
        if (sql.includes('FROM session_evaluation_configs'))
          return Promise.resolve([{ exists: false }]);
        return Promise.resolve([]);
      }),
    };
    const dataSource = {
      transaction: (work: (transactionManager: EntityManager) => Promise<unknown>) =>
        work(manager as unknown as EntityManager),
    } as unknown as DataSource;

    await expect(
      updateSessionTable(dataSource, current, 'table-2', 'room-1', 'tutor-1', false),
    ).resolves.toMatchObject({
      sessoesAtualizadas: [{ sessaoId: 'session-1', rotulo: 'Sessão 1' }],
      sessoesIgnoradas: [],
    });
    expect(submittedChecks).toBe(2);
    expect(manager.query).toHaveBeenCalledWith(
      'UPDATE sessions SET performance_table_id = $2, uses_default_table = FALSE WHERE id = $1;',
      ['session-1', 'copied-table'],
    );
    expect(manager.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE session_evaluation_configs'),
      expect.anything(),
    );
  });
});
