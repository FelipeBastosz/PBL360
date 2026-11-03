import { api } from './api';
import type { ClassFinalReportResponse, ExportClassReportOptions } from '@/types/class-report';

export const classReportService = {
  getFinalReport: (roomId: string): Promise<ClassFinalReportResponse> =>
    api.get<ClassFinalReportResponse>(`/salas/${roomId}/relatorio-final`).then((r) => r.data),

  exportFinalReport: (
    roomId: string,
    formato: 'PDF' | 'XLSX',
    options?: ExportClassReportOptions,
  ) =>
    api
      .get<Blob>(`/salas/${roomId}/relatorio-final/exportacao`, {
        params: { formato, ...options },
        responseType: 'blob',
      })
      .then((r) => r.data),
};
