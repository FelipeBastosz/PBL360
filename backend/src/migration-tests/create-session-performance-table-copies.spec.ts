import type { QueryRunner } from 'typeorm';
import { CreateSessionPerformanceTableCopies1792100000000 } from '../migrations/1792100000000-CreateSessionPerformanceTableCopies';

describe('CreateSessionPerformanceTableCopies1792100000000', () => {
  it('copies each problem table and remaps snapshot and evaluation criterion references', async () => {
    let executedSql = '';
    const query = jest.fn((sql: string) => {
      executedSql = sql;
      return Promise.resolve(undefined);
    });

    await new CreateSessionPerformanceTableCopies1792100000000().up({
      query,
    } as unknown as QueryRunner);

    expect(executedSql).toContain('CREATE TEMP TABLE session_performance_table_copies');
    expect(executedSql).toContain('SELECT DISTINCT s.performance_table_id AS source_table_id');
    expect(executedSql).toContain('INSERT INTO performance_tables');
    expect(executedSql).toContain('UPDATE session_evaluation_criteria snapshot');
    expect(executedSql).toContain('UPDATE criterion_grades grade');
    expect(executedSql).toContain('UPDATE evaluation_items item');
    expect(executedSql).toContain('UPDATE session_evaluation_configs config');
  });
});
