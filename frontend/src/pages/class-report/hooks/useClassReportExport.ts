import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import type { ExportClassReportOptions } from '@/types/class-report';
import { parseBlobError } from '@/utils/download';
import { performClassReportExport, type ClassReportFormat } from '../classReportDownload';

export type { ClassReportFormat };

export function useClassReportExport(roomId?: string, courseCode?: string, roomName?: string) {
  const { notify } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ClassReportFormat | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isExporting = isExportingPDF || isExportingExcel;

  const handleExport = (formato: ClassReportFormat) => {
    setSelectedFormat(formato);
  };

  const closeModal = () => {
    if (!isExporting) setSelectedFormat(null);
  };

  const confirmExport = async (options: ExportClassReportOptions): Promise<boolean> => {
    if (!roomId || !selectedFormat || isExporting) return false;
    const format = selectedFormat;
    const setBusy = format === 'PDF' ? setIsExportingPDF : setIsExportingExcel;
    setBusy(true);

    try {
      await performClassReportExport(roomId, courseCode, roomName, format, options);
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
