import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProblemUpdatedByAndIndexes1790302421906 implements MigrationInterface {
  name = 'AddProblemUpdatedByAndIndexes1790302421906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_problems_room_id"`);
    await queryRunner.query(`ALTER TABLE "problems" ADD "updated_by" uuid`);
    await queryRunner.query(`CREATE INDEX "idx_rooms_tutor_id" ON "rooms" ("tutor_id") `);
    await queryRunner.query(`CREATE INDEX "idx_problems_created_by" ON "problems" ("created_by") `);
    await queryRunner.query(
      `ALTER TABLE "problems" ADD CONSTRAINT "fk_problems_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "problems" DROP CONSTRAINT "fk_problems_updated_by"`);
    await queryRunner.query(`DROP INDEX "public"."idx_problems_created_by"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rooms_tutor_id"`);
    await queryRunner.query(`ALTER TABLE "problems" DROP COLUMN "updated_by"`);
    await queryRunner.query(`CREATE INDEX "idx_problems_room_id" ON "problems" ("room_id") `);
  }
}
