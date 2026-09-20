import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountVerification1789908997054 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN active SET DEFAULT FALSE;`);

    await queryRunner.query(`ALTER TABLE email_verification_codes ADD COLUMN user_id UUID;`);

    await queryRunner.query(`
      UPDATE email_verification_codes AS codes
      SET user_id = users.id
      FROM users
      WHERE users.email = codes.email;
    `);

    await queryRunner.query(`DELETE FROM email_verification_codes WHERE user_id IS NULL;`);

    await queryRunner.query(`
      ALTER TABLE email_verification_codes
        ALTER COLUMN user_id SET NOT NULL,
        ADD CONSTRAINT fk_email_verification_codes_user
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_verification_codes_user_id"
        ON email_verification_codes (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_email_verification_codes_user_id";`);

    await queryRunner.query(`
      ALTER TABLE email_verification_codes
        DROP CONSTRAINT IF EXISTS fk_email_verification_codes_user,
        DROP COLUMN IF EXISTS user_id;
    `);

    await queryRunner.query(`ALTER TABLE users ALTER COLUMN active SET DEFAULT TRUE;`);
  }
}
