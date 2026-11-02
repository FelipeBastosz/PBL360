import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import type { ExportProblemReportOptions } from '@/types/problemReport';
import {
  performProblemReportExport,
  parseBlobError,
  type ReportFormat,
} from '../problemReportDownload';

export type { ReportFormat };

export function useProblemReportExport(roomId: string, problemId: string, problemTitle?: string) {
  const { notify } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isExporting = isExportingPDF || isExportingExcel;

  const handleExport = (formato: ReportFormat) => {
    setSelectedFormat(formato);
  };

  const closeModal = () => {
    if (!isExporting) setSelectedFormat(null);
  };

  const confirmExport = async (options: ExportProblemReportOptions): Promise<boolean> => {
    if (!roomId || !problemId || !selectedFormat || isExporting) return false;
    const format = selectedFormat;
    const setBusy = format === 'PDF' ? setIsExportingPDF : setIsExportingExcel;
    setBusy(true);

    try {
      await performProblemReportExport(roomId, problemId, problemTitle, format, options);
      setSelectedFormat(null);
      return true;
    } catch (error) {
      notify({ tone: 'error', message: await parseBlobError(error) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    selectedFormat,
    isModalOpen: selectedFormat !== null,
    isExportingPDF,
    isExportingExcel,
    isExporting,
    handleExport,
    openModal: handleExport,
    closeModal,
    confirmExport,
  };
}
