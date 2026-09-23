import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AlignRoomTutorsSchema1790197940059 implements MigrationInterface {
  name = 'AlignRoomTutorsSchema1790197940059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_tutors" DROP CONSTRAINT "fk_room_tutors_room"`);
    await queryRunner.query(`ALTER TABLE "room_tutors" DROP CONSTRAINT "fk_room_tutors_tutor"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_37b4b3a1c4db8f643be3b4f562" ON "room_tutors" ("room_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f103c3156f0f7c7c42f60aa74" ON "room_tutors" ("tutor_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "room_tutors" ADD CONSTRAINT "fk_room_tutors_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_tutors" ADD CONSTRAINT "fk_room_tutors_tutor" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "room_tutors" DROP CONSTRAINT "fk_room_tutors_tutor"`);
    await queryRunner.query(`ALTER TABLE "room_tutors" DROP CONSTRAINT "fk_room_tutors_room"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4f103c3156f0f7c7c42f60aa74"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_37b4b3a1c4db8f643be3b4f562"`);
    await queryRunner.query(
      `ALTER TABLE "room_tutors" ADD CONSTRAINT "fk_room_tutors_tutor" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_tutors" ADD CONSTRAINT "fk_room_tutors_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
