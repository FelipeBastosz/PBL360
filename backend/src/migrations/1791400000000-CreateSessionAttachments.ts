import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionAttachments1791400000000 implements MigrationInterface {
  name = 'CreateSessionAttachments1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE session_attachments (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        uploaded_by UUID NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        size_bytes INTEGER NOT NULL,
        content BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_session_attachments PRIMARY KEY (id),
        CONSTRAINT fk_session_attachments_session
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_session_attachments_uploader
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT ck_session_attachments_mime_type CHECK (mime_type = 'application/pdf'),
        CONSTRAINT ck_session_attachments_size
          CHECK (octet_length(content) BETWEEN 1 AND 10485760)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_session_attachments_session ON session_attachments(session_id, created_at);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS session_attachments;`);
  }
}
