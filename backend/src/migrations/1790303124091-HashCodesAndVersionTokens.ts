import type { MigrationInterface, QueryRunner } from 'typeorm';

const CODE_TABLES = ['email_verification_codes', 'password_reset_codes'];

export class HashCodesAndVersionTokens1790303124091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(
      `ALTER TABLE "email_verification_codes" ADD "attempts" integer NOT NULL DEFAULT 0`,
    );

    for (const table of CODE_TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "code_hash" character varying(64)`);
      await queryRunner.query(
        `UPDATE "${table}" SET "code_hash" = encode(sha256(convert_to("code", 'UTF8')), 'hex')`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "code_hash" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "code"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of CODE_TABLES) {
      await queryRunner.query(`UPDATE "${table}" SET "used_at" = now() WHERE "used_at" IS NULL`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "code" character varying(6) NOT NULL DEFAULT '000000'`,
      );
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "code" DROP DEFAULT`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "code_hash"`);
    }

    await queryRunner.query(`ALTER TABLE "email_verification_codes" DROP COLUMN "attempts"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
  }
}
