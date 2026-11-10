import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { sessionService } from '@/services/session.service';
import type { ExportSessionReportOptions } from '@/types/sessionReport';
import {
  buildSessionReportFileName,
  parseBlobError,
  triggerBlobDownload,
} from './sessionReportDownload';

async function performExport(
  sessionId: string,
  sessionTitle: string | undefined,
  formato: 'PDF' | 'XLSX',
  options?: ExportSessionReportOptions,
): Promise<void> {
  const blob = await sessionService.exportSessionReport(sessionId, formato, options);
  const fileName = buildSessionReportFileName(sessionTitle, sessionId, formato);
  triggerBlobDownload(blob, fileName);
}

export function useSessionReportExport(sessionId: string, sessionTitle?: string) {
  const { notify } = useToast();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleDownload = async (
    formato: 'PDF' | 'XLSX',
    options?: ExportSessionReportOptions,
  ): Promise<boolean> => {
    if (!sessionId) return false;
    const setBusy = formato === 'PDF' ? setIsExportingPDF : setIsExportingExcel;
    setBusy(true);

    try {
      await performExport(sessionId, sessionTitle, formato, options);
      return true;
    } catch (error) {
      notify({ tone: 'error', message: await parseBlobError(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { isExportingPDF, isExportingExcel, handleDownload };
}
