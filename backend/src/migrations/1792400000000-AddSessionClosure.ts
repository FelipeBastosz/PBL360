import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionClosure1792400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions
        ADD COLUMN closed_at TIMESTAMPTZ NULL,
        ADD COLUMN closed_by UUID NULL,
        ADD CONSTRAINT fk_sessions_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sessions DROP CONSTRAINT fk_sessions_closed_by,
        DROP COLUMN closed_by, DROP COLUMN closed_at;
    `);
  }
}
