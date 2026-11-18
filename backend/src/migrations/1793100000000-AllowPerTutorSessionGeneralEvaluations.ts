import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowPerTutorSessionGeneralEvaluations1793100000000 implements MigrationInterface {
  name = 'AllowPerTutorSessionGeneralEvaluations1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session_general_evaluations"
        DROP CONSTRAINT "uq_session_general_evaluations_session";
      ALTER TABLE "session_general_evaluations"
        ADD CONSTRAINT "uq_session_general_evaluations_session_author"
        UNIQUE ("session_id", "created_by");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session_general_evaluations"
        DROP CONSTRAINT "uq_session_general_evaluations_session_author";
      ALTER TABLE "session_general_evaluations"
        ADD CONSTRAINT "uq_session_general_evaluations_session"
        UNIQUE ("session_id");
    `);
  }
}
