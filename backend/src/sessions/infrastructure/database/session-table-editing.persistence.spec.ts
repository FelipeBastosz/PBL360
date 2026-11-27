import { syncPerformanceCriteria } from '@/performance-tables/infrastructure/database/performance-criteria.persistence';
import {
  replaceSessionSnapshot,
  removeObsoleteDraftItems,
} from './session-evaluation-snapshot.persistence';
import { assertTutorItemsRemainValid } from './session-table-editing.validation';
import { persistSessionTableEdit } from './session-table-editing.persistence';

jest.mock('@/performance-tables/infrastructure/database/performance-criteria.persistence', () => ({
  syncPerformanceCriteria: jest.fn(),
}));
jest.mock('./session-evaluation-snapshot.persistence', () => ({
  replaceSessionSnapshot: jest.fn(),
  removeObsoleteDraftItems: jest.fn(),
}));
jest.mock('./session-table-editing.validation', () => ({ assertTutorItemsRemainValid: jest.fn() }));

describe('persistSessionTableEdit', () => {
  beforeEach(() => jest.clearAllMocks());

  const table = {
    id: 'table-1',
    tutorId: 'tutor-1',
    roomId: 'room-1',
    name: 'Nova',
    description: null,
    criteria: [
      { id: 'criterion-1', name: 'Critério', description: null, orderIndex: 1, weight: 10 },
    ],
  };
  const usage = {
    sessionId: 'session-1',
    label: 'Sessão 1',
    roomId: 'room-1',
    hasOccurred: false,
    canAccess: true,
  };

  it('updates the original table and session references without touching missing snapshots', async () => {
    const manager = { query: jest.fn().mockResolvedValue([]) };
    const plan = { table, sessions: [usage], copy: false };

    await expect(persistSessionTableEdit(manager as never, plan as never)).resolves.toEqual({
      table: { id: 'table-1', name: 'Nova' },
      sessions: [usage],
    });
    expect(assertTutorItemsRemainValid).toHaveBeenCalledWith(manager, plan);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE performance_tables'),
      ['table-1', 'Nova'],
    );
    expect(syncPerformanceCriteria).toHaveBeenCalledWith(manager, table);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE sessions'), [
      'session-1',
      'table-1',
    ]);
    expect(replaceSessionSnapshot).not.toHaveBeenCalled();
    expect(removeObsoleteDraftItems).not.toHaveBeenCalled();
  });

  it('copies the table, remaps criterion references, and refreshes existing snapshots', async () => {
    const manager = {
      query: jest.fn((sql: string) =>
        sql.includes('SELECT session_id FROM session_evaluation_configs')
          ? Promise.resolve([{ session_id: 'session-1' }])
          : Promise.resolve([]),
      ),
    };
    const plan = {
      table: { ...table, criteria: [...table.criteria] },
      sessions: [usage],
      copy: true,
    };

    await persistSessionTableEdit(manager as never, plan as never);

    expect(manager.query.mock.calls[0][0]).toContain('INSERT INTO performance_tables');
    expect(manager.query.mock.calls[0][1]).toEqual(
      expect.arrayContaining(['tutor-1', 'room-1', 'Nova', null]),
    );
    expect(
      manager.query.mock.calls.some(([sql]: [string]) => sql.includes('UPDATE evaluation_items')),
    ).toBe(true);
    expect(
      manager.query.mock.calls.some(([sql]: [string]) => sql.includes('UPDATE criterion_grades')),
    ).toBe(true);
    expect(replaceSessionSnapshot).toHaveBeenCalledWith(manager, 'session-1', {
      id: plan.table.id,
      name: 'Nova',
      isDefault: false,
    });
    expect(removeObsoleteDraftItems).toHaveBeenCalledWith(manager, 'session-1');
    expect(
      manager.query.mock.calls.some(([sql]: [string]) => sql.includes('UPDATE evaluations')),
    ).toBe(true);
  });
});
