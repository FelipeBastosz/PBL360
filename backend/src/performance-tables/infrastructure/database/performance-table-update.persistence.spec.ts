import type { PerformanceTable } from '../../domain/entities/performance-table.entity';
import { syncPerformanceCriteria } from './performance-criteria.persistence';
import { assertPastSessionUpdateAllowed } from './performance-table-update.validation';
import { propagatePerformanceTableSessions } from './performance-table-session.persistence';
import { lockPerformanceTableSessions } from './performance-table-lock.persistence';
import { persistTableUpdate } from './performance-table-update.persistence';

jest.mock('./performance-criteria.persistence', () => ({ syncPerformanceCriteria: jest.fn() }));
jest.mock('./performance-table-update.validation', () => ({
  assertPastSessionUpdateAllowed: jest.fn(),
}));
jest.mock('./performance-table-session.persistence', () => ({
  propagatePerformanceTableSessions: jest.fn(),
}));
jest.mock('./performance-table-lock.persistence', () => ({
  lockPerformanceTableSessions: jest.fn(),
}));

describe('persistTableUpdate', () => {
  const table = {
    id: 'table-1',
    tutorId: 'tutor-1',
    name: 'Atualizada',
    description: null,
    criteria: [],
  } as never as PerformanceTable;

  beforeEach(() => jest.clearAllMocks());

  it('locks and updates an owned table, syncs criteria, and optionally propagates', async () => {
    const manager = { query: jest.fn().mockResolvedValue([{ id: table.id }]) };

    await persistTableUpdate(manager as never, table, true, 'tutor-1');

    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      table.id,
      table.tutorId,
    ]);
    expect(lockPerformanceTableSessions).toHaveBeenCalledWith(manager, table.id);
    expect(assertPastSessionUpdateAllowed).toHaveBeenCalledWith(manager, table);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE performance_tables'),
      [table.id, table.name, table.description],
    );
    expect(syncPerformanceCriteria).toHaveBeenCalledWith(manager, table);
    expect(propagatePerformanceTableSessions).toHaveBeenCalledWith(manager, table, 'tutor-1');
  });

  it('does not propagate when propagation was not requested', async () => {
    const manager = { query: jest.fn().mockResolvedValue([{ id: table.id }]) };

    await persistTableUpdate(manager as never, table, false, 'tutor-1');

    expect(syncPerformanceCriteria).toHaveBeenCalledTimes(1);
    expect(propagatePerformanceTableSessions).not.toHaveBeenCalled();
  });

  it('rejects when the tutor does not own an active table', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) };

    await expect(persistTableUpdate(manager as never, table, false, 'tutor-1')).rejects.toThrow(
      'Tabela de desempenho não encontrada.',
    );
    expect(lockPerformanceTableSessions).not.toHaveBeenCalled();
  });
});
