import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGradeRecalculationHistory1792200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE grade_recalculation_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE RESTRICT,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        previous_score NUMERIC(5,2) NOT NULL CHECK (previous_score BETWEEN 0 AND 10),
        new_score NUMERIC(5,2) NOT NULL CHECK (new_score BETWEEN 0 AND 10),
        reason_code VARCHAR(60) NOT NULL CHECK (reason_code = 'CRITERION_WEIGHTS_CHANGED'),
        changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (previous_score <> new_score)
      );
      CREATE INDEX idx_grade_recalculation_history_student
        ON grade_recalculation_history(student_id, created_at DESC);
      CREATE INDEX idx_grade_recalculation_history_session
        ON grade_recalculation_history(session_id, created_at DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE grade_recalculation_history;');
  }
}
