import type { SessionAttachment } from '../entities/session-attachment.entity';

export const SESSION_ATTACHMENT_REPOSITORY = Symbol('SESSION_ATTACHMENT_REPOSITORY');

export interface SessionAttachmentSummary {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploader: { id: string; name: string };
  createdAt: Date;
}

export interface SessionAttachmentFile {
  fileName: string;
  mimeType: string;
  content: Buffer;
}

export interface SessionAttachmentRepository {
  create(attachment: SessionAttachment): Promise<SessionAttachmentSummary>;
  listBySession(sessionId: string): Promise<SessionAttachmentSummary[]>;
  findFile(sessionId: string, attachmentId: string): Promise<SessionAttachmentFile | null>;
}
