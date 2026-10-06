import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvaluations1791300000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE evaluation_type AS ENUM ('TUTOR_SESSION', 'SELF_ASSESSMENT', 'PEER_ASSESSMENT');
      CREATE TYPE evaluation_status AS ENUM ('DRAFT', 'SUBMITTED');
      CREATE TABLE evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
        session_id UUID REFERENCES sessions(id) ON DELETE RESTRICT,
        config_session_id UUID REFERENCES session_evaluation_configs(session_id) ON DELETE RESTRICT,
        performance_table_id UUID NOT NULL REFERENCES performance_tables(id) ON DELETE RESTRICT,
        type evaluation_type NOT NULL,
        status evaluation_status NOT NULL DEFAULT 'DRAFT',
        submitted_at TIMESTAMPTZ,
        session_score NUMERIC(5,2) CHECK (session_score BETWEEN 0 AND 10),
        applied_bonus NUMERIC(3,2) CHECK (applied_bonus BETWEEN 0 AND 1),
        calculation_version VARCHAR(60),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_tutor_evaluation_session CHECK (
          type <> 'TUTOR_SESSION' OR
          (session_id IS NOT NULL AND config_session_id IS NOT NULL AND config_session_id = session_id)
        ),
        CONSTRAINT ck_evaluation_submission CHECK (
          (status = 'DRAFT' AND submitted_at IS NULL AND session_score IS NULL AND applied_bonus IS NULL)
          OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND
            (type <> 'TUTOR_SESSION' OR
              (session_score IS NOT NULL AND applied_bonus IS NOT NULL AND calculation_version IS NOT NULL)))
        )
      );
      CREATE UNIQUE INDEX uq_tutor_session_evaluation ON evaluations(session_id, student_id)
        WHERE type = 'TUTOR_SESSION';
      CREATE INDEX idx_evaluations_problem ON evaluations(problem_id);
      CREATE INDEX idx_evaluations_student ON evaluations(student_id);
      CREATE TABLE evaluation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE RESTRICT,
        criterion_id UUID NOT NULL REFERENCES performance_criteria(id) ON DELETE RESTRICT,
        score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 10),
        comment TEXT,
        UNIQUE (evaluation_id, criterion_id)
      );
      CREATE INDEX idx_evaluation_items_criterion ON evaluation_items(criterion_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE evaluation_items; DROP TABLE evaluations;
      DROP TYPE evaluation_status; DROP TYPE evaluation_type;`);
  }
}
