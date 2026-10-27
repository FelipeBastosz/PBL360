import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCriterionMaximumScores1792600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE session_evaluation_criteria DROP COLUMN IF EXISTS max_score;
      ALTER TABLE performance_criteria DROP COLUMN IF EXISTS max_score;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
        ADD COLUMN max_score NUMERIC(4,2) NOT NULL DEFAULT 10,
        ADD CONSTRAINT chk_performance_criteria_max_score CHECK (max_score > 0 AND max_score <= 10);
      ALTER TABLE session_evaluation_criteria
        ADD COLUMN max_score NUMERIC(4,2) NOT NULL DEFAULT 10,
        ADD CONSTRAINT chk_session_criteria_max_score CHECK (max_score > 0 AND max_score <= 10);
    `);
  }
}
