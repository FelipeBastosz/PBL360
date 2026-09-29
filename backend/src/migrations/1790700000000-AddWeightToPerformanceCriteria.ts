import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeightToPerformanceCriteria1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
      ADD COLUMN weight NUMERIC(4, 2) NOT NULL DEFAULT 1,
      ADD CONSTRAINT chk_performance_criteria_weight
        CHECK (weight >= 0 AND weight <= 10);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
      DROP COLUMN weight;
    `);
  }
}
