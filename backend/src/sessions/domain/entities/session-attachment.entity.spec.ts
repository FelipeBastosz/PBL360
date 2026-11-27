import { AttachmentCategory } from '../enums/attachment-category.enum';
import { InvalidAttachmentError } from '../errors/invalid-attachment.error';
import {
  MAX_ATTACHMENT_BYTES,
  normalizeFileName,
  SessionAttachment,
} from './session-attachment.entity';

const pdf = (size = 64) => Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(size)]);

const upload = (
  content: Buffer,
  fileName = 'Relatório Final.pdf',
  category: AttachmentCategory = AttachmentCategory.SESSION_ATTACHMENT,
) =>
  SessionAttachment.fromUpload({
    sessionId: 'session-1',
    uploadedBy: 'student-1',
    fileName,
    content,
    category,
  });

describe('SessionAttachment (Domain)', () => {
  it('accepts a PDF and keeps its size, type and category', () => {
    const attachment = upload(pdf(), 'Relatório Final.pdf', AttachmentCategory.TABLE_REPORT);

    expect(attachment).toMatchObject({
      sessionId: 'session-1',
      uploadedBy: 'student-1',
      fileName: 'Relatório Final.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdf().length,
      category: AttachmentCategory.TABLE_REPORT,
    });
  });

  it.each(['INVALID_CATEGORY', '', undefined])('rejects invalid category %j', (invalidCategory) => {
    expect(() =>
      SessionAttachment.fromUpload({
        sessionId: 'session-1',
        uploadedBy: 'student-1',
        fileName: 'Relatório Final.pdf',
        content: pdf(),
        category: invalidCategory as unknown as AttachmentCategory,
      }),
    ).toThrow(new InvalidAttachmentError('Categoria de anexo inválida.'));
  });

  it('does not infer category from file name', () => {
    const attachment = upload(
      pdf(),
      'Relatorio_Mesa_Final.pdf',
      AttachmentCategory.SESSION_ATTACHMENT,
    );

    expect(attachment.category).toBe(AttachmentCategory.SESSION_ATTACHMENT);
  });

  it('rejects a file that is not a PDF, whatever its name says', () => {
    expect(() => upload(Buffer.from('PK\u0003\u0004 docx'), 'trabalho.pdf')).toThrow(
      new InvalidAttachmentError('Envie um arquivo PDF.'),
    );
  });

  it('rejects an empty file', () => {
    expect(() => upload(Buffer.alloc(0))).toThrow('O arquivo enviado está vazio.');
  });

  it('accepts exactly 10 MB and rejects anything above', () => {
    const limit = Buffer.concat([pdf(0), Buffer.alloc(MAX_ATTACHMENT_BYTES - pdf(0).length)]);

    expect(upload(limit).sizeBytes).toBe(MAX_ATTACHMENT_BYTES);
    expect(() => upload(Buffer.concat([limit, Buffer.alloc(1)]))).toThrow(
      'O arquivo deve ter no máximo 10 MB.',
    );
  });
});

describe('normalizeFileName', () => {
  it('drops folders, quotes and control characters', () => {
    expect(normalizeFileName('C:\\Users\\ana\\"Pesquisa"\u0007 base.pdf')).toBe(
      'Pesquisa base.pdf',
    );
  });

  it('always ends with .pdf and falls back to a default name', () => {
    expect(normalizeFileName('relatorio')).toBe('relatorio.pdf');
    expect(normalizeFileName('RELATORIO.PDF')).toBe('RELATORIO.pdf');
    expect(normalizeFileName(undefined)).toBe('documento.pdf');
  });

  it('keeps the name within 255 characters', () => {
    expect(normalizeFileName(`${'a'.repeat(400)}.pdf`)).toHaveLength(255);
  });
});
