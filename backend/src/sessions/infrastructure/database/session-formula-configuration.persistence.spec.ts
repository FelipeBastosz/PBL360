import type { DataSource, EntityManager } from 'typeorm';
import { SessionFormulaComponentType } from '../../application/dtos/session-evaluation-configuration.dto';
import {
  DEFAULT_SESSION_FORMULA,
  readSessionFormula,
  restoreSessionFormula,
  updateSessionFormula,
  type PersistedSessionFormulaRow,
} from './session-formula-configuration.persistence';
import type { SessionConfigRow } from './session-table-configuration.persistence';

const current: SessionConfigRow = {
  id: 'session-1',
  problemId: 'problem-1',
  orderIndex: 2,
  title: 'Sessão 2',
};

const components = [
  { type: SessionFormulaComponentType.CRITERIOS, weight: 75 },
  { type: SessionFormulaComponentType.PAPEL, weight: 25 },
];

function createDataSource(
  sessions: SessionConfigRow[],
  versions: Array<{ version: number }> = [{ version: 1 }],
  formulas: Array<{ id: string }> = [{ id: 'formula-1' }],
) {
  const query = jest.fn((sql: string) => {
    if (sql.includes('SELECT id, problem_id AS "problemId"')) return Promise.resolve(sessions);
    if (sql.includes('COALESCE(MAX(version)')) return Promise.resolve(versions);
    if (sql.includes('INSERT INTO formulas')) return Promise.resolve(formulas);
    return Promise.resolve([]);
  });
  const manager = { query };
  const dataSource = {
    transaction: jest.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager as unknown as EntityManager),
    ),
  } as unknown as DataSource;
  return { dataSource, manager, query };
}

describe('session formula configuration persistence', () => {
  it('reads persisted session formula rows', async () => {
    const rows: PersistedSessionFormulaRow[] = [
      { isDefault: false, version: 2, type: SessionFormulaComponentType.CRITERIOS, weight: '75' },
    ];
    const query = jest.fn().mockResolvedValue(rows);
    await expect(
      readSessionFormula({ query } as unknown as EntityManager, 'session-1'),
    ).resolves.toEqual(rows);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("f.scope = 'SESSAO'"), [
      'session-1',
    ]);
  });

  it('updates only the current session and persists each formula component', async () => {
    const target = { ...current };
    const { dataSource, query } = createDataSource([target], [{ version: 3 }]);

    await updateSessionFormula(dataSource, current, 'tutor-1', components, false);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('order_index = $2'), [
      current.problemId,
      current.orderIndex,
    ]);
    expect(
      query.mock.calls
        .filter(([sql]) => sql.includes('INSERT INTO formulas'))
        .map(([, params]) => params),
    ).toEqual([[current.id, 3, false, 'tutor-1']]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO formula_components'), [
      'formula-1',
      SessionFormulaComponentType.CRITERIOS,
      75,
    ]);
    expect(query).toHaveBeenCalledTimes(7);
  });

  it('updates the current and following sessions with a new version for each', async () => {
    const next = { ...current, id: 'session-3', orderIndex: 3, title: 'Sessão 3' };
    const { dataSource, query } = createDataSource([current, next]);

    await updateSessionFormula(dataSource, current, 'tutor-1', components, true);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('order_index >= $2'), [
      current.problemId,
      current.orderIndex,
    ]);
    expect(
      query.mock.calls
        .filter(([sql]) => sql.includes('INSERT INTO formulas'))
        .map(([, params]) => params),
    ).toEqual([
      ['session-1', 1, false, 'tutor-1'],
      ['session-3', 1, false, 'tutor-1'],
    ]);
  });

  it('restores the default formula and falls back to version one when none exists', async () => {
    const { dataSource, query } = createDataSource([current], []);

    await restoreSessionFormula(dataSource, current, 'tutor-1');

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO formulas'), [
      current.id,
      1,
      true,
      'tutor-1',
    ]);
    for (const component of DEFAULT_SESSION_FORMULA) {
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO formula_components'),
        ['formula-1', component.type, component.weight],
      );
    }
  });

  it('fails when the formula insert does not return an id', async () => {
    const { dataSource } = createDataSource([current], [{ version: 0 }], []);
    await expect(
      updateSessionFormula(dataSource, current, 'tutor-1', components, false),
    ).rejects.toThrow('Failed to persist the session formula.');
  });
});
