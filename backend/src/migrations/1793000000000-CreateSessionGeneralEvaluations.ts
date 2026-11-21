import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionGeneralEvaluations1793000000000 implements MigrationInterface {
  name = 'CreateSessionGeneralEvaluations1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "session_general_evaluations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "text" character varying(2000) NOT NULL,
        "created_by" uuid NOT NULL,
        "updated_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_session_general_evaluations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_session_general_evaluations_session" UNIQUE ("session_id"),
        CONSTRAINT "fk_session_general_evaluations_session"
          FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_session_general_evaluations_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_session_general_evaluations_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "session_general_evaluations";');
  }
}
