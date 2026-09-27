import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceTables1790400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE performance_tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL,
        name VARCHAR(120) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ DEFAULT NULL,

        CONSTRAINT fk_performance_tables_tutor
          FOREIGN KEY (tutor_id)
          REFERENCES users(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX idx_performance_tables_tutor_id
        ON performance_tables(tutor_id);

      CREATE TABLE performance_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        performance_table_id UUID NOT NULL,
        name VARCHAR(120) NOT NULL,
        description TEXT DEFAULT NULL,
        order_index SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ DEFAULT NULL,

        CONSTRAINT uq_performance_criteria_table_order
          UNIQUE (performance_table_id, order_index),
        CONSTRAINT fk_performance_criteria_table
          FOREIGN KEY (performance_table_id)
          REFERENCES performance_tables(id)
          ON DELETE RESTRICT
      );

      CREATE INDEX idx_performance_criteria_table_id
        ON performance_criteria(performance_table_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS performance_criteria;`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance_tables;`);
  }
}
