import { toBrazilianDate } from '@/shared/dates/brazilian-date';
import { AttachmentCategoryPayload } from '../../application/dtos/session-attachment.dto';
import type { ProblemTableReportResponseDto } from '../../application/dtos/problem-table-report.dto';
import type { ProblemTableReportSummary } from '../../domain/repositories/session-attachment.repository';

export const toProblemTableReportResponse = (
  report: ProblemTableReportSummary,
): ProblemTableReportResponseDto => ({
  id: report.id,
  nomeArquivo: report.fileName,
  tipo: report.mimeType,
  tamanho: report.sizeBytes,
  categoria: AttachmentCategoryPayload.RELATORIO_MESA,
  enviadoPor: { id: report.uploader.id, nome: report.uploader.name },
  enviadoEm: report.createdAt,
  sessaoId: report.session.id,
  sessao: {
    id: report.session.id,
    titulo: report.session.title,
    data: toBrazilianDate(report.session.date)!,
    ordem: report.session.orderIndex,
  },
  urlDownload: `/sessoes/${report.session.id}/anexos/${report.id}`,
});
