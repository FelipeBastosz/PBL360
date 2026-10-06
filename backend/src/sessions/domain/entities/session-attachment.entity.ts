import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { InvalidAttachmentError } from '../errors/invalid-attachment.error';
import { Session } from './session.entity';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const PDF_MIME_TYPE = 'application/pdf';

const PDF_SIGNATURE = Buffer.from('%PDF-', 'latin1');

const MAX_FILE_NAME = 255;

export interface NewSessionAttachment {
  sessionId: string;
  uploadedBy: string;
  fileName: string | undefined;
  content: Buffer;
}

export function normalizeFileName(raw: string | undefined): string {
  const base = (raw ?? '').split(/[\\/]/).pop() ?? '';
  const printable = [...base].filter(
    (char) => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127,
  );
  const cleaned = printable.join('').replace(/"/g, '').replace(/\s+/g, ' ').trim();
  const stem = (cleaned.replace(/\.pdf$/i, '') || 'documento').slice(0, MAX_FILE_NAME - 4);
  return `${stem}.pdf`;
}

@Entity('session_attachments')
@Index('idx_session_attachments_session', ['sessionId', 'createdAt'])
@Check('ck_session_attachments_mime_type', `mime_type = 'application/pdf'`)
@Check('ck_session_attachments_size', 'octet_length(content) BETWEEN 1 AND 10485760')
export class SessionAttachment {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'pk_session_attachments' })
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @Column({ type: 'bytea' })
  content!: Buffer;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Session, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id', foreignKeyConstraintName: 'fk_session_attachments_session' })
  session?: Session;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by', foreignKeyConstraintName: 'fk_session_attachments_uploader' })
  uploader?: User;

  static fromUpload(input: NewSessionAttachment): SessionAttachment {
    if (input.content.length === 0)
      throw new InvalidAttachmentError('O arquivo enviado está vazio.');
    if (input.content.length > MAX_ATTACHMENT_BYTES) {
      throw new InvalidAttachmentError('O arquivo deve ter no máximo 10 MB.');
    }
    if (!input.content.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
      throw new InvalidAttachmentError('Envie um arquivo PDF.');
    }
    const attachment = new SessionAttachment();
    attachment.sessionId = input.sessionId;
    attachment.uploadedBy = input.uploadedBy;
    attachment.fileName = normalizeFileName(input.fileName);
    attachment.mimeType = PDF_MIME_TYPE;
    attachment.sizeBytes = input.content.length;
    attachment.content = input.content;
    return attachment;
  }
}
