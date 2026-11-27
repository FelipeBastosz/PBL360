import { StreamableFile } from '@nestjs/common';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SessionAttachmentsController } from './session-attachments.controller';

describe('SessionAttachmentsController', () => {
  const member = { id: 'u1', type: UserType.TUTOR };
  const attachment = {
    id: 'a1',
    fileName: 'documento.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 12,
    uploader: { id: 'u1', name: 'Tutor' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('uploads an attachment and maps its summary', async () => {
    const upload = { execute: jest.fn().mockResolvedValue(attachment) };
    const controller = new SessionAttachmentsController(
      upload as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const file = { originalname: 'documento.pdf', buffer: Buffer.from('pdf') };

    await expect(controller.upload('sess1', member, file)).resolves.toEqual({
      id: 'a1',
      nomeArquivo: 'documento.pdf',
      tipo: 'application/pdf',
      tamanho: 12,
      enviadoPor: { id: 'u1', nome: 'Tutor' },
      enviadoEm: attachment.createdAt,
    });
    expect(upload.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      member,
      fileName: 'documento.pdf',
      content: file.buffer,
    });
  });

  it('lists mapped attachments for the current member', async () => {
    const list = { execute: jest.fn().mockResolvedValue([attachment]) };
    const controller = new SessionAttachmentsController(
      {} as never,
      list as never,
      {} as never,
      {} as never,
    );

    await expect(controller.list('sess1', member)).resolves.toMatchObject([
      { id: 'a1', nomeArquivo: 'documento.pdf', enviadoPor: { nome: 'Tutor' } },
    ]);
    expect(list.execute).toHaveBeenCalledWith({ sessionId: 'sess1', member });
  });

  it('downloads with file headers and delegates deletion', async () => {
    const content = Buffer.from('pdf-content');
    const download = {
      execute: jest
        .fn()
        .mockResolvedValue({ content, mimeType: 'application/pdf', fileName: 'arquivo.pdf' }),
    };
    const remove = { execute: jest.fn() };
    const controller = new SessionAttachmentsController(
      {} as never,
      {} as never,
      download as never,
      remove as never,
    );

    const file = await controller.download('sess1', 'a1', member);
    expect(file).toBeInstanceOf(StreamableFile);
    expect(file.getHeaders()).toMatchObject({ type: 'application/pdf', length: content.length });
    expect(download.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      attachmentId: 'a1',
      member,
    });
    await expect(controller.delete('sess1', 'a1', member)).resolves.toBeUndefined();
    expect(remove.execute).toHaveBeenCalledWith({ sessionId: 'sess1', attachmentId: 'a1', member });
  });
});
