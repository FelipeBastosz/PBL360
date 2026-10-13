import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSelfAssessmentConstraint1792300000000 implements MigrationInterface {
  name = 'AddSelfAssessmentConstraint1791900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_self_assessment_session_student
        ON evaluations(session_id, student_id)
        WHERE type = 'SELF_ASSESSMENT';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX uq_self_assessment_session_student;');
  }
}
