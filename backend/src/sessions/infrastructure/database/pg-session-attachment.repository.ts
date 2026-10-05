import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { SessionAttachment } from '../../domain/entities/session-attachment.entity';
import type {
  SessionAttachmentFile,
  SessionAttachmentRepository,
  SessionAttachmentSummary,
} from '../../domain/repositories/session-attachment.repository';

interface SummaryRow {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploaderName: string;
  createdAt: Date;
}

const SUMMARY_COLUMNS = `
  a.id, a.file_name AS "fileName", a.mime_type AS "mimeType", a.size_bytes AS "sizeBytes",
  u.id AS "uploaderId", u.name AS "uploaderName", a.created_at AS "createdAt"`;

const INSERT_SQL = `
  WITH inserted AS (
    INSERT INTO session_attachments (session_id, uploaded_by, file_name, mime_type, size_bytes, content)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  )
  SELECT ${SUMMARY_COLUMNS} FROM inserted a JOIN users u ON u.id = a.uploaded_by;`;

const LIST_SQL = `
  SELECT ${SUMMARY_COLUMNS}
  FROM session_attachments a
  JOIN users u ON u.id = a.uploaded_by
  WHERE a.session_id = $1
  ORDER BY a.created_at DESC;`;

const FILE_SQL = `
  SELECT file_name AS "fileName", mime_type AS "mimeType", content
  FROM session_attachments WHERE session_id = $1 AND id = $2;`;

const toSummary = (row: SummaryRow): SessionAttachmentSummary => ({
  id: row.id,
  fileName: row.fileName,
  mimeType: row.mimeType,
  sizeBytes: Number(row.sizeBytes),
  uploader: { id: row.uploaderId, name: row.uploaderName },
  createdAt: row.createdAt,
});

@Injectable()
export class PgSessionAttachmentRepository implements SessionAttachmentRepository {
  constructor(
    @InjectRepository(SessionAttachment)
    private readonly attachments: Repository<SessionAttachment>,
  ) {}

  async create(attachment: SessionAttachment): Promise<SessionAttachmentSummary> {
    const rows = await this.attachments.query<SummaryRow[]>(INSERT_SQL, [
      attachment.sessionId,
      attachment.uploadedBy,
      attachment.fileName,
      attachment.mimeType,
      attachment.sizeBytes,
      attachment.content,
    ]);
    return toSummary(requireFirstRow(rows, 'Failed to persist session attachment.'));
  }

  async listBySession(sessionId: string): Promise<SessionAttachmentSummary[]> {
    const rows = await this.attachments.query<SummaryRow[]>(LIST_SQL, [sessionId]);
    return rows.map(toSummary);
  }

  async findFile(sessionId: string, attachmentId: string): Promise<SessionAttachmentFile | null> {
    const rows = await this.attachments.query<SessionAttachmentFile[]>(FILE_SQL, [
      sessionId,
      attachmentId,
    ]);
    return firstRowOrNull(rows);
  }
}
