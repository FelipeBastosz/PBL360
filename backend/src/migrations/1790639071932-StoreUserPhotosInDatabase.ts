import type { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreUserPhotosInDatabase1790639071932 implements MigrationInterface {
  name = 'StoreUserPhotosInDatabase1790639071932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_photos (
        user_id UUID NOT NULL,
        content BYTEA NOT NULL,
        mime_type VARCHAR(20) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_user_photos PRIMARY KEY (user_id),
        CONSTRAINT fk_user_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_user_photos_mime_type
          CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
        CONSTRAINT chk_user_photos_size CHECK (octet_length(content) BETWEEN 1 AND 2097152)
      );
    `);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN photo_url;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN photo_url VARCHAR(255);`);
    await queryRunner.query(`DROP TABLE user_photos;`);
  }
}
