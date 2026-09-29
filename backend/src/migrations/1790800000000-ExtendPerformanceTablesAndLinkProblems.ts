import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendPerformanceTablesAndLinkProblems1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_tables
        ADD COLUMN description TEXT DEFAULT NULL;

      CREATE TYPE performance_criterion_category AS ENUM ('CONTENT', 'PARTICIPATION', 'BEHAVIOR');

      ALTER TABLE performance_criteria
        ADD COLUMN category performance_criterion_category NOT NULL DEFAULT 'CONTENT',
        ADD COLUMN max_score NUMERIC(5, 2) NOT NULL DEFAULT 10,
        ADD CONSTRAINT chk_performance_criteria_max_score CHECK (max_score > 0);

      ALTER TABLE problems
        ADD COLUMN performance_table_id UUID DEFAULT NULL,
        ADD CONSTRAINT fk_problems_performance_table
          FOREIGN KEY (performance_table_id)
          REFERENCES performance_tables(id)
          ON DELETE RESTRICT;

      CREATE INDEX idx_problems_performance_table_id
        ON problems(performance_table_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_problems_performance_table_id;

      ALTER TABLE problems
        DROP CONSTRAINT IF EXISTS fk_problems_performance_table,
        DROP COLUMN IF EXISTS performance_table_id;

      ALTER TABLE performance_criteria
        DROP CONSTRAINT IF EXISTS chk_performance_criteria_max_score,
        DROP COLUMN IF EXISTS max_score,
        DROP COLUMN IF EXISTS category;

      DROP TYPE IF EXISTS performance_criterion_category;

      ALTER TABLE performance_tables
        DROP COLUMN IF EXISTS description;
    `);
  }
}
