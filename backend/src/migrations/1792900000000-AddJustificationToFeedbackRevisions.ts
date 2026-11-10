import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJustificationToFeedbackRevisions1792900000000 implements MigrationInterface {
  name = 'AddJustificationToFeedbackRevisions1792900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedback_revisions"
        ADD COLUMN "justificativa" VARCHAR(500);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "feedback_revisions"
        DROP COLUMN "justificativa";
    `);
  }
}
