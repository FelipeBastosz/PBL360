import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignPerformanceCriteriaContract1790900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
        DROP CONSTRAINT IF EXISTS chk_performance_criteria_max_score,
        DROP COLUMN IF EXISTS max_score,
        DROP COLUMN IF EXISTS category;

      DROP TYPE IF EXISTS performance_criterion_category;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE performance_criterion_category AS ENUM ('CONTENT', 'PARTICIPATION', 'BEHAVIOR');

      ALTER TABLE performance_criteria
        ADD COLUMN category performance_criterion_category NOT NULL DEFAULT 'CONTENT',
        ADD COLUMN max_score NUMERIC(5, 2) NOT NULL DEFAULT 10,
        ADD CONSTRAINT chk_performance_criteria_max_score CHECK (max_score > 0);
    `);
  }
}
