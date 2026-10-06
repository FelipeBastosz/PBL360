import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultToPerformanceTables1791100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_tables
        ADD COLUMN is_default BOOLEAN;

      UPDATE performance_tables
         SET is_default = FALSE
       WHERE is_default IS NULL;

      UPDATE performance_tables
         SET is_default = TRUE
       WHERE name = 'Fórmula Padrão'
         AND description = 'Critérios padrão de avaliação.'
         AND deleted_at IS NULL;

      ALTER TABLE performance_tables
        ALTER COLUMN is_default SET NOT NULL;

      CREATE UNIQUE INDEX uq_performance_tables_tutor_default
        ON performance_tables(tutor_id)
        WHERE is_default = TRUE AND deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_performance_tables_tutor_default;
      ALTER TABLE performance_tables DROP COLUMN IF EXISTS is_default;
    `);
  }
}
