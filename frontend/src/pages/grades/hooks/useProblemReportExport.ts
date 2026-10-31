import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { problemService } from '@/services/problem.service';
import { parseBlobError, triggerBlobDownload } from '@/utils/download';

export type ReportFormat = 'PDF' | 'XLSX';

export function useProblemReportExport(roomId: string, problemId: string, problemTitle?: string) {
  const { notify } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isExporting = isExportingPDF || isExportingExcel;

  const handleExport = async (formato: ReportFormat) => {
    if (!roomId || !problemId || isExporting) return;

    if (formato === 'PDF') setIsExportingPDF(true);
    else setIsExportingExcel(true);

    try {
      const blob = await problemService.exportReport(roomId, problemId, formato);
      const cleanTitle = problemTitle ? problemTitle.toLowerCase().replace(/\s+/g, '-') : problemId;
      const ext = formato === 'PDF' ? 'pdf' : 'xlsx';
      triggerBlobDownload(blob, `relatorio-problema-${cleanTitle}.${ext}`);
    } catch (error) {
      const message = await parseBlobError(error);
      notify({ tone: 'error', message });
    } finally {
      if (formato === 'PDF') setIsExportingPDF(false);
      else setIsExportingExcel(false);
    }
  };

  return {
    isExportingPDF,
    isExportingExcel,
    isExporting,
    handleExport,
  };
}
