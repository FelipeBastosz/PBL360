import { AttachmentCategoryPayload } from '../../application/dtos/session-attachment.dto';
import { AttachmentCategory } from '../../domain/enums/attachment-category.enum';
import { toProblemTableReportResponse } from './problem-table-reports.mapper';

describe('toProblemTableReportResponse', () => {
  it('maps file metadata, uploader, session context with Brazilian date, and download URL', () => {
    const createdAt = new Date('2026-10-05T15:00:00.000Z');

    const response = toProblemTableReportResponse({
      id: 'att-1',
      fileName: 'Relatorio_Mesa_1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4096,
      category: AttachmentCategory.TABLE_REPORT,
      uploader: { id: 'user-1', name: 'Ana Souza' },
      createdAt,
      session: {
        id: 'sess-1',
        title: 'Sessão de Fechamento',
        date: '2026-10-05',
        orderIndex: 2,
      },
    });

    expect(response).toEqual({
      id: 'att-1',
      nomeArquivo: 'Relatorio_Mesa_1.pdf',
      tipo: 'application/pdf',
      tamanho: 4096,
      categoria: AttachmentCategoryPayload.RELATORIO_MESA,
      enviadoPor: { id: 'user-1', nome: 'Ana Souza' },
      enviadoEm: createdAt,
      sessaoId: 'sess-1',
      sessao: {
        id: 'sess-1',
        titulo: 'Sessão de Fechamento',
        data: '05-10-2026',
        ordem: 2,
      },
      urlDownload: '/sessoes/sess-1/anexos/att-1',
    });
  });
});
