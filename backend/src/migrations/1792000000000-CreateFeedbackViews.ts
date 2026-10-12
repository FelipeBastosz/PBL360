import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackViews1792000000000 implements MigrationInterface {
  name = 'CreateFeedbackViews1792000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE feedback_views (
        feedback_id uuid NOT NULL,
        student_id uuid NOT NULL,
        first_viewed_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_feedback_views PRIMARY KEY (feedback_id, student_id),
        CONSTRAINT fk_feedback_views_feedback FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
        CONSTRAINT fk_feedback_views_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE feedback_views;');
  }
}
