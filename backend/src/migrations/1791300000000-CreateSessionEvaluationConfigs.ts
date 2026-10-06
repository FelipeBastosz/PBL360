import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionEvaluationConfigs1791300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE session_evaluation_configs (
        session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE RESTRICT,
        performance_table_id UUID NOT NULL REFERENCES performance_tables(id) ON DELETE RESTRICT,
        table_name VARCHAR(120) NOT NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE session_evaluation_criteria (
        session_id UUID NOT NULL REFERENCES session_evaluation_configs(session_id) ON DELETE RESTRICT,
        criterion_id UUID NOT NULL REFERENCES performance_criteria(id) ON DELETE RESTRICT,
        name VARCHAR(120) NOT NULL,
        description TEXT,
        weight NUMERIC(4,2) NOT NULL CHECK (weight >= 0 AND weight <= 10),
        order_index SMALLINT NOT NULL CHECK (order_index > 0),
        PRIMARY KEY (session_id, criterion_id),
        UNIQUE (session_id, order_index)
      );
      CREATE INDEX idx_session_evaluation_configs_table ON session_evaluation_configs(performance_table_id);
      CREATE INDEX idx_session_evaluation_criteria_criterion ON session_evaluation_criteria(criterion_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE session_evaluation_criteria; DROP TABLE session_evaluation_configs;',
    );
  }
}
