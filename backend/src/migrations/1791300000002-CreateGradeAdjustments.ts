import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGradeAdjustments1791300000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE grade_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_item_id UUID NOT NULL REFERENCES evaluation_items(id) ON DELETE RESTRICT,
        previous_value NUMERIC(5,2) NOT NULL CHECK (previous_value BETWEEN 0 AND 10),
        new_value NUMERIC(5,2) NOT NULL CHECK (new_value BETWEEN 0 AND 10),
        justification VARCHAR(500) NOT NULL CHECK (char_length(btrim(justification)) BETWEEN 10 AND 500),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (previous_value <> new_value)
      );
      CREATE INDEX idx_grade_adjustments_item ON grade_adjustments(evaluation_item_id, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE grade_adjustments;');
  }
}
