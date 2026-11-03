import { toSlug } from '@/utils/slug';
import { triggerBlobDownload } from '@/utils/download';
import { classReportService } from '@/services/class-report.service';
import type { ExportClassReportOptions } from '@/types/class-report';

export type ClassReportFormat = 'PDF' | 'XLSX';

export function buildClassReportFileName(
  courseCode: string | undefined,
  roomName: string | undefined,
  formato: ClassReportFormat,
  fallbackId?: string,
): string {
  const parts = [courseCode, roomName].filter(Boolean).join(' ');
  const slug = toSlug(parts) || (fallbackId ? toSlug(fallbackId) : '');
  const ext = formato === 'PDF' ? 'pdf' : 'xlsx';
  return slug ? `relatorio-final-${slug}.${ext}` : `relatorio-final.${ext}`;
}

export async function performClassReportExport(
  roomId: string,
  courseCode: string | undefined,
  roomName: string | undefined,
  formato: ClassReportFormat,
  options?: ExportClassReportOptions,
): Promise<void> {
  const blob = await classReportService.exportFinalReport(roomId, formato, options);
  const fileName = buildClassReportFileName(courseCode, roomName, formato, roomId);
  triggerBlobDownload(blob, fileName);
}
