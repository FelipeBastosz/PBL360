import { api } from './api';
import type { ClassFinalReportResponse } from '@/types/class-report';

export const classReportService = {
  getFinalReport: (roomId: string): Promise<ClassFinalReportResponse> =>
    api.get<ClassFinalReportResponse>(`/salas/${roomId}/relatorio-final`).then((r) => r.data),

  exportFinalReport: (roomId: string, formato: 'PDF' | 'XLSX') =>
    api
      .get<Blob>(`/salas/${roomId}/relatorio-final/exportacao`, {
        params: { formato },
        responseType: 'blob',
      })
      .then((r) => r.data),
};
