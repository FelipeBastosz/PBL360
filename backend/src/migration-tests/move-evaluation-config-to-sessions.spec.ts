import type { QueryRunner } from 'typeorm';
import { MoveEvaluationConfigToSessions1792000000000 } from '../migrations/1792000000000-MoveEvaluationConfigToSessions';

describe('MoveEvaluationConfigToSessions1792000000000', () => {
  it('backfills tables and session formulas while preserving rollback data', async () => {
    let executedSql = '';
    const query = jest.fn((sql: string) => {
      executedSql = sql;
      return Promise.resolve(undefined);
    });
    const migration = new MoveEvaluationConfigToSessions1792000000000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(executedSql).toContain('CREATE TABLE move_evaluation_config_problem_table_backup');
    expect(executedSql).toContain('UPDATE sessions s');
    expect(executedSql).toContain('p.performance_table_id');
    expect(executedSql).toContain(
      'INSERT INTO formulas (problem_id, session_id, legacy_formula_id',
    );
    expect(executedSql).toContain('SELECT NULL, s.id, f.id, f.scope, f.version');
    expect(executedSql).toContain("SELECT NULL, s.id, 'SESSAO', 1, TRUE, TRUE");
    expect(executedSql).toContain('CREATE TABLE move_evaluation_config_component_backup');
  });

  it('restores problem table assignments and legacy session formulas on rollback', async () => {
    let executedSql = '';
    const query = jest.fn((sql: string) => {
      executedSql = sql;
      return Promise.resolve(undefined);
    });
    const migration = new MoveEvaluationConfigToSessions1792000000000();

    await migration.down({ query } as unknown as QueryRunner);

    expect(executedSql).toContain('FROM move_evaluation_config_formula_backup');
    expect(executedSql).toContain('FROM move_evaluation_config_component_backup');
    expect(executedSql).toContain('FROM move_evaluation_config_problem_table_backup');
    expect(executedSql).toContain('DROP TABLE move_evaluation_config_formula_backup');
  });
});
