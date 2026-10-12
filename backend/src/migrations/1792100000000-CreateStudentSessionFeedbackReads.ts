import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentSessionFeedbackReads1792100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE student_session_feedback_reads (
        feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at timestamptz NOT NULL,
        PRIMARY KEY (feedback_id, student_id)
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE student_session_feedback_reads;');
  }
}
