import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRoomCodeConstraint1790301797582 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rooms" RENAME CONSTRAINT "uq_rooms_access_token" TO "uq_rooms_room_code"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rooms" RENAME CONSTRAINT "uq_rooms_room_code" TO "uq_rooms_access_token"`,
    );
  }
}
