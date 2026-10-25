import { api } from './api';
import type { ClassFinalReportResponse } from '@/types/class-report';

export const classReportService = {
  getFinalReport: (roomId: string): Promise<ClassFinalReportResponse> =>
    api.get<ClassFinalReportResponse>(`/salas/${roomId}/relatorio-final`).then((r) => r.data),
};
