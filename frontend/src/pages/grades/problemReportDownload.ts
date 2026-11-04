import { toSlug } from '@/utils/slug';
import { parseBlobError, triggerBlobDownload } from '@/utils/download';
import { problemService } from '@/services/problem.service';
import type { ExportProblemReportOptions } from '@/types/problemReport';

export type ReportFormat = 'PDF' | 'XLSX';

export function buildProblemReportFileName(
  problemTitle: string | undefined,
  problemId: string,
  formato: ReportFormat,
): string {
  const cleanTitle = problemTitle ? toSlug(problemTitle) : '';
  const identifier = cleanTitle || toSlug(problemId) || problemId;
  return `relatorio-problema-${identifier}.${formato.toLowerCase()}`;
}

export async function performProblemReportExport(
  roomId: string,
  problemId: string,
  problemTitle: string | undefined,
  formato: ReportFormat,
  options?: ExportProblemReportOptions,
): Promise<void> {
  const blob = await problemService.exportReport(roomId, problemId, formato, options);
  const fileName = buildProblemReportFileName(problemTitle, problemId, formato);
  triggerBlobDownload(blob, fileName);
}

export { toSlug, parseBlobError, triggerBlobDownload };
