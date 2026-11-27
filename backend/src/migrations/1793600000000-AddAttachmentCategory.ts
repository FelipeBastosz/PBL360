import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentCategory1793600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE session_attachments ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'SESSION_ATTACHMENT';`,
    );
    await queryRunner.query(
      `ALTER TABLE session_attachments ADD CONSTRAINT ck_session_attachments_category CHECK (category IN ('BOARD_REPORT', 'SESSION_ATTACHMENT'));`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_session_attachments_session_category ON session_attachments(session_id, category, created_at DESC);`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_session_attachments_session_category;');
    await queryRunner.query(
      'ALTER TABLE session_attachments DROP CONSTRAINT IF EXISTS ck_session_attachments_category;',
    );
    await queryRunner.query('ALTER TABLE session_attachments DROP COLUMN IF EXISTS category;');
  }
}
