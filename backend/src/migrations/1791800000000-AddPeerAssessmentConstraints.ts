import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeerAssessmentConstraints1791800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_peer_session_evaluation ON evaluations(session_id, evaluator_id, student_id)
        WHERE type = 'PEER_ASSESSMENT';

      ALTER TABLE evaluations
        ADD CONSTRAINT ck_peer_assessment_different_users
        CHECK (type <> 'PEER_ASSESSMENT' OR evaluator_id <> student_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluations DROP CONSTRAINT ck_peer_assessment_different_users;
      DROP INDEX uq_peer_session_evaluation;
    `);
  }
}
