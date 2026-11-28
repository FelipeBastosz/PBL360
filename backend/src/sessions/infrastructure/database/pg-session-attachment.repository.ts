import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { AttachmentCategory } from '../../domain/enums/attachment-category.enum';
import { SessionAttachment } from '../../domain/entities/session-attachment.entity';
import type {
  ProblemTableReportSummary,
  SessionAttachmentFile,
  SessionAttachmentRepository,
  SessionAttachmentSummary,
} from '../../domain/repositories/session-attachment.repository';

interface SummaryRow {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
  uploaderId: string;
  uploaderName: string;
  createdAt: Date;
}

interface ProblemTableReportRow extends SummaryRow {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionOrderIndex: number;
}

const SUMMARY_COLUMNS = `
  a.id, a.file_name AS "fileName", a.mime_type AS "mimeType", a.size_bytes AS "sizeBytes",
  a.category, u.id AS "uploaderId", u.name AS "uploaderName", a.created_at AS "createdAt"`;

const INSERT_SQL = `
  WITH inserted AS (
    INSERT INTO session_attachments (session_id, uploaded_by, file_name, mime_type, size_bytes, category, content)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  )
  SELECT ${SUMMARY_COLUMNS} FROM inserted a JOIN users u ON u.id = a.uploaded_by;`;

const LIST_SQL = `
  SELECT ${SUMMARY_COLUMNS}
  FROM session_attachments a
  JOIN users u ON u.id = a.uploaded_by
  WHERE a.session_id = $1
  ORDER BY a.created_at DESC;`;

const LIST_TABLE_REPORTS_BY_PROBLEM_SQL = `
  SELECT ${SUMMARY_COLUMNS},
         s.id AS "sessionId", s.title AS "sessionTitle",
         to_char(s.date, 'YYYY-MM-DD') AS "sessionDate", s.order_index AS "sessionOrderIndex"
  FROM sessions s
  JOIN problems p ON p.id = s.problem_id
  JOIN rooms r ON r.id = p.room_id
  JOIN session_attachments a ON a.session_id = s.id
  JOIN users u ON u.id = a.uploaded_by
  WHERE s.problem_id = $1
    AND p.room_id = $2
    AND r.deleted_at IS NULL
    AND a.category = $3
  ORDER BY s.date ASC, s.order_index ASC, a.created_at DESC, a.id DESC;`;

const FILE_SQL = `
  SELECT file_name AS "fileName", mime_type AS "mimeType", content
  FROM session_attachments WHERE session_id = $1 AND id = $2;`;

const UPLOADER_SQL = `
  SELECT uploaded_by AS "uploadedBy"
  FROM session_attachments WHERE session_id = $1 AND id = $2;`;

const DELETE_SQL = 'DELETE FROM session_attachments WHERE id = $1;';

const toSummary = (row: SummaryRow): SessionAttachmentSummary => ({
  id: row.id,
  fileName: row.fileName,
  mimeType: row.mimeType,
  sizeBytes: Number(row.sizeBytes),
  category: row.category,
  uploader: { id: row.uploaderId, name: row.uploaderName },
  createdAt: row.createdAt,
});

const toProblemTableReport = (row: ProblemTableReportRow): ProblemTableReportSummary => ({
  ...toSummary(row),
  session: {
    id: row.sessionId,
    title: row.sessionTitle,
    date: row.sessionDate,
    orderIndex: Number(row.sessionOrderIndex),
  },
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
      attachment.category,
      attachment.content,
    ]);
    return toSummary(requireFirstRow(rows, 'Failed to persist session attachment.'));
  }

  async listBySession(sessionId: string): Promise<SessionAttachmentSummary[]> {
    const rows = await this.attachments.query<SummaryRow[]>(LIST_SQL, [sessionId]);
    return rows.map(toSummary);
  }

  async listTableReportsByProblem(
    roomId: string,
    problemId: string,
  ): Promise<ProblemTableReportSummary[]> {
    const rows = await this.attachments.query<ProblemTableReportRow[]>(
      LIST_TABLE_REPORTS_BY_PROBLEM_SQL,
      [problemId, roomId, AttachmentCategory.TABLE_REPORT],
    );
    return rows.map(toProblemTableReport);
  }

  async findFile(sessionId: string, attachmentId: string): Promise<SessionAttachmentFile | null> {
    const rows = await this.attachments.query<SessionAttachmentFile[]>(FILE_SQL, [
      sessionId,
      attachmentId,
    ]);
    return firstRowOrNull(rows);
  }

  async findUploader(sessionId: string, attachmentId: string): Promise<string | null> {
    const rows = await this.attachments.query<{ uploadedBy: string }[]>(UPLOADER_SQL, [
      sessionId,
      attachmentId,
    ]);
    return firstRowOrNull(rows)?.uploadedBy ?? null;
  }

  async delete(attachmentId: string): Promise<void> {
    await this.attachments.query(DELETE_SQL, [attachmentId]);
  }
}
