import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { classReportService } from '@/services/class-report.service';
import { parseBlobError, triggerBlobDownload } from '@/utils/download';

export type ClassReportFormat = 'PDF' | 'XLSX';

export function useClassReportExport(roomId?: string, roomName?: string) {
  const { notify } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isExporting = isExportingPDF || isExportingExcel;

  const handleExport = async (formato: ClassReportFormat) => {
    if (!roomId || isExporting) return;

    if (formato === 'PDF') setIsExportingPDF(true);
    else setIsExportingExcel(true);

    try {
      const blob = await classReportService.exportFinalReport(roomId, formato);
      const cleanName = roomName ? roomName.toLowerCase().replace(/\s+/g, '-') : roomId;
      const ext = formato === 'PDF' ? 'pdf' : 'xlsx';
      triggerBlobDownload(blob, `relatorio-final-${cleanName}.${ext}`);
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
