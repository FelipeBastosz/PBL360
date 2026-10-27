import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGrades1791600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE criterion_grades (
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        criterion_id UUID NOT NULL,
        score NUMERIC(10, 6),
        CONSTRAINT pk_criterion_grades PRIMARY KEY (session_id, student_id, criterion_id),
        CONSTRAINT fk_criterion_grades_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_criterion_grades_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_criterion_grades_criterion FOREIGN KEY (criterion_id) REFERENCES performance_criteria(id) ON DELETE CASCADE,
        CONSTRAINT ck_criterion_grades_score CHECK (score IS NULL OR (score >= 0 AND score <= 10))
      );
      CREATE TABLE session_grades (
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        grade NUMERIC(10, 6),
        situation VARCHAR(20) NOT NULL,
        formula_version INTEGER NOT NULL,
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_session_grades PRIMARY KEY (session_id, student_id),
        CONSTRAINT fk_session_grades_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_session_grades_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE problem_grades (
        problem_id UUID NOT NULL,
        student_id UUID NOT NULL,
        grade NUMERIC(10, 6),
        formula_version INTEGER NOT NULL,
        calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_problem_grades PRIMARY KEY (problem_id, student_id),
        CONSTRAINT fk_problem_grades_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
        CONSTRAINT fk_problem_grades_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS problem_grades, session_grades, criterion_grades;',
    );
  }
}
