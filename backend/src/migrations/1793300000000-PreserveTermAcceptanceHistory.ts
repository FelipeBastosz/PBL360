import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PreserveTermAcceptanceHistory1793300000000 implements MigrationInterface {
  name = 'PreserveTermAcceptanceHistory1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_term_acceptances
      DROP CONSTRAINT uq_user_term_acceptances_user;
    `);
    await queryRunner.query(`
      ALTER TABLE user_term_acceptances
      ADD CONSTRAINT uq_user_term_acceptances_user_term UNIQUE (user_id, term_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT user_id
          FROM user_term_acceptances
          GROUP BY user_id
          HAVING COUNT(*) > 1
        ) THEN
          RAISE EXCEPTION 'Cannot restore one acceptance per user without deleting history.';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE user_term_acceptances
      DROP CONSTRAINT uq_user_term_acceptances_user_term;
    `);
    await queryRunner.query(`
      ALTER TABLE user_term_acceptances
      ADD CONSTRAINT uq_user_term_acceptances_user UNIQUE (user_id);
    `);
  }
}
