import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationIdToGradeAdjustments1792400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE grade_adjustments
        ADD COLUMN evaluation_id UUID REFERENCES evaluations(id) ON DELETE RESTRICT,
        ALTER COLUMN evaluation_item_id DROP NOT NULL,
        ADD CONSTRAINT ck_grade_adjustments_target
          CHECK (num_nonnulls(evaluation_id, evaluation_item_id) = 1);
      CREATE INDEX idx_grade_adjustments_evaluation ON grade_adjustments(evaluation_id, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX idx_grade_adjustments_evaluation;
      DELETE FROM grade_adjustments WHERE evaluation_id IS NOT NULL;
      ALTER TABLE grade_adjustments
        DROP CONSTRAINT ck_grade_adjustments_target,
        ALTER COLUMN evaluation_item_id SET NOT NULL,
        DROP COLUMN evaluation_id;
    `);
  }
}
