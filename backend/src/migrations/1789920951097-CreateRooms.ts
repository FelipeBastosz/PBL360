import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRooms1789920951097 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(12) NOT NULL,
        access_token VARCHAR(64) NOT NULL,
        semester VARCHAR(10) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT uq_rooms_code UNIQUE (code),
        CONSTRAINT uq_rooms_access_token UNIQUE (access_token),
        CONSTRAINT fk_rooms_tutor
          FOREIGN KEY (tutor_id)
          REFERENCES users(id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS rooms;`);
  }
}
