import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationReleaseTracking1791700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE problems
        ADD COLUMN peer_eval_deadline TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN released_by UUID DEFAULT NULL,
        ADD CONSTRAINT fk_problems_released_by FOREIGN KEY (released_by) REFERENCES users(id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE problems
        DROP CONSTRAINT fk_problems_released_by,
        DROP COLUMN released_by,
        DROP COLUMN peer_eval_deadline;
    `);
  }
}
