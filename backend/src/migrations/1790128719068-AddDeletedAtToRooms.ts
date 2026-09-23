import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddDeletedAtToRooms1790128719068 implements MigrationInterface {
  name = 'AddDeletedAtToRooms1790128719068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rooms" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rooms" DROP COLUMN "deleted_at"`);
  }
}
