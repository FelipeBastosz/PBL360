import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationReleasesToSessions1791700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions
        ADD COLUMN self_eval_released BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN peer_eval_released BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN self_eval_deadline TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN peer_eval_deadline TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN released_at TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN released_by UUID DEFAULT NULL,
        ADD CONSTRAINT fk_sessions_released_by FOREIGN KEY (released_by) REFERENCES users(id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions
        DROP CONSTRAINT fk_sessions_released_by,
        DROP COLUMN released_by,
        DROP COLUMN released_at,
        DROP COLUMN peer_eval_deadline,
        DROP COLUMN self_eval_deadline,
        DROP COLUMN peer_eval_released,
        DROP COLUMN self_eval_released;
    `);
  }
}
