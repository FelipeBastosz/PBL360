import type { MigrationInterface, QueryRunner } from 'typeorm';

export class IndexSessionsByProblemDate1793700000000 implements MigrationInterface {
  name = 'IndexSessionsByProblemDate1793700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX idx_sessions_problem_date ON sessions(problem_id, date, order_index);',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_sessions_problem_date;');
  }
}
