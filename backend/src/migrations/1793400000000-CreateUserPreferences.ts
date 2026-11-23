import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserPreferences1793400000000 implements MigrationInterface {
  name = 'CreateUserPreferences1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_preferences (
        user_id UUID NOT NULL,
        theme VARCHAR(10) NOT NULL DEFAULT 'LIGHT',
        color VARCHAR(7) NOT NULL DEFAULT '#000077',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_user_preferences PRIMARY KEY (user_id),
        CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_user_preferences_theme CHECK (theme IN ('LIGHT', 'DARK')),
        CONSTRAINT chk_user_preferences_color CHECK (color ~ '^#[0-9A-F]{6}$')
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE user_preferences;`);
  }
}
