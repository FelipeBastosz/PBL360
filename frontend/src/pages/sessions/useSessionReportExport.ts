import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { sessionService } from '@/services/session.service';
import { parseBlobError, triggerBlobDownload } from './sessionReportDownload';

export function useSessionReportExport(sessionId: string) {
  const { notify } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleDownload = async (formato: 'PDF' | 'XLSX') => {
    if (!sessionId) return;
    if (formato === 'PDF') setIsExportingPDF(true);
    else setIsExportingExcel(true);

    try {
      const blob = await sessionService.exportSessionReport(sessionId, formato);
      triggerBlobDownload(blob, `relatorio-sessao-${sessionId}.${formato.toLowerCase()}`);
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
    handleDownload,
  };
}
