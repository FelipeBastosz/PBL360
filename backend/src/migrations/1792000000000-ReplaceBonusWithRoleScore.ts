import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceBonusWithRoleScore1792000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE session_roles DROP CONSTRAINT IF EXISTS ck_session_roles_bonus_score;
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'session_roles' AND column_name = 'bonus_score'
        ) THEN
          ALTER TABLE session_roles RENAME COLUMN bonus_score TO role_score;
          ALTER TABLE session_roles ALTER COLUMN role_score TYPE NUMERIC(4, 2);
          UPDATE session_roles SET role_score = role_score * 10 WHERE role_score IS NOT NULL;
        END IF;
      END $$;
      ALTER TABLE session_roles DROP CONSTRAINT IF EXISTS ck_session_roles_role_score;
      ALTER TABLE session_roles ADD CONSTRAINT ck_session_roles_role_score
        CHECK (role_score IS NULL OR (role_score >= 0 AND role_score <= 10));

      ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_applied_bonus_check;
      ALTER TABLE evaluations ALTER COLUMN applied_bonus TYPE NUMERIC(4, 2);
      ALTER TABLE evaluations ADD CONSTRAINT evaluations_applied_bonus_check
        CHECK (applied_bonus IS NULL OR (applied_bonus >= 0 AND applied_bonus <= 10));
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE session_roles DROP CONSTRAINT IF EXISTS ck_session_roles_role_score;
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'session_roles' AND column_name = 'role_score'
        ) THEN
          UPDATE session_roles SET role_score = role_score / 10 WHERE role_score IS NOT NULL;
          ALTER TABLE session_roles ALTER COLUMN role_score TYPE NUMERIC(3, 2);
          ALTER TABLE session_roles RENAME COLUMN role_score TO bonus_score;
        END IF;
      END $$;
      ALTER TABLE session_roles DROP CONSTRAINT IF EXISTS ck_session_roles_bonus_score;
      ALTER TABLE session_roles ADD CONSTRAINT ck_session_roles_bonus_score
        CHECK (bonus_score IS NULL OR (bonus_score >= 0 AND bonus_score <= 1));
    `);
  }
}
