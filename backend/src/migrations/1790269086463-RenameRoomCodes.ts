import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRoomCodes1790269086463 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rooms" RENAME COLUMN "code" TO "course_code"`);
    await queryRunner.query(`ALTER TABLE "rooms" RENAME COLUMN "access_token" TO "room_code"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rooms" RENAME COLUMN "room_code" TO "access_token"`);
    await queryRunner.query(`ALTER TABLE "rooms" RENAME COLUMN "course_code" TO "code"`);
  }
}
