import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeightAndMaxScoreToPerformanceCriteria1790411000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
        ADD COLUMN weight NUMERIC(10, 2) NOT NULL DEFAULT 1,
        ADD COLUMN max_score NUMERIC(10, 2) NOT NULL DEFAULT 10;
      ALTER TABLE performance_criteria
        ADD CONSTRAINT chk_performance_criteria_weight_positive CHECK (weight > 0),
        ADD CONSTRAINT chk_performance_criteria_max_score_positive CHECK (max_score > 0);
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
        DROP CONSTRAINT IF EXISTS chk_performance_criteria_weight_positive,
        DROP CONSTRAINT IF EXISTS chk_performance_criteria_max_score_positive,
        DROP COLUMN IF EXISTS weight,
        DROP COLUMN IF EXISTS max_score;
    `);
  }
}
