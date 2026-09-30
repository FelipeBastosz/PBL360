import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePerformanceCriteriaHistory1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_criteria
        DROP CONSTRAINT IF EXISTS uq_performance_criteria_table_order;

      CREATE UNIQUE INDEX uq_performance_criteria_table_order_active
        ON performance_criteria(performance_table_id, order_index)
        WHERE deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_performance_criteria_table_order_active;

      ALTER TABLE performance_criteria
        ADD CONSTRAINT uq_performance_criteria_table_order
        UNIQUE (performance_table_id, order_index);
    `);
  }
}
