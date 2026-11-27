import { PgSessionAttachmentRepository } from './pg-session-attachment.repository';
import { AttachmentCategory } from '../../domain/enums/attachment-category.enum';

describe('PgSessionAttachmentRepository', () => {
  it('creates and lists attachment summaries with numeric sizes', async () => {
    const row = {
      id: 'attachment-1',
      fileName: 'relatorio.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '128',
      category: AttachmentCategory.TABLE_REPORT,
      uploaderId: 'teacher-1',
      uploaderName: 'Docente',
      createdAt: new Date(),
    };
    const query = jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([row]);
    const repository = new PgSessionAttachmentRepository({ query } as never);
    const attachment = {
      sessionId: 'session-1',
      uploadedBy: 'teacher-1',
      fileName: 'relatorio.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 128,
      category: AttachmentCategory.TABLE_REPORT,
      content: Buffer.from('pdf'),
    };

    await expect(repository.create(attachment as never)).resolves.toEqual({
      id: 'attachment-1',
      fileName: 'relatorio.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 128,
      category: AttachmentCategory.TABLE_REPORT,
      uploader: { id: 'teacher-1', name: 'Docente' },
      createdAt: row.createdAt,
    });
    await expect(repository.listBySession('session-1')).resolves.toMatchObject([
      { id: 'attachment-1', sizeBytes: 128 },
    ]);
    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [
      'session-1',
      'teacher-1',
      'relatorio.pdf',
      'application/pdf',
      128,
      AttachmentCategory.TABLE_REPORT,
      attachment.content,
    ]);
  });

  it('rejects insert without a returned row', async () => {
    const repository = new PgSessionAttachmentRepository({
      query: jest.fn().mockResolvedValue([]),
    } as never);
    await expect(repository.create({} as never)).rejects.toThrow(
      'Failed to persist session attachment.',
    );
  });

  it('finds file content and uploader, returning null when missing, and deletes by id', async () => {
    const content = Buffer.from('pdf');
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ fileName: 'doc.pdf', mimeType: 'application/pdf', content }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ uploadedBy: 'teacher-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const repository = new PgSessionAttachmentRepository({ query } as never);

    await expect(repository.findFile('session-1', 'attachment-1')).resolves.toEqual({
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      content,
    });
    await expect(repository.findFile('session-1', 'missing')).resolves.toBeNull();
    await expect(repository.findUploader('session-1', 'attachment-1')).resolves.toBe('teacher-1');
    await expect(repository.findUploader('session-1', 'missing')).resolves.toBeNull();
    await repository.delete('attachment-1');
    expect(query).toHaveBeenNthCalledWith(5, expect.any(String), ['attachment-1']);
  });
});
