import type { StudentPerformance } from '@/types/studentPerformance';
import { api } from './api';

export const studentPerformanceService = {
  // Without problemaId the API returns the sessions of every problem in the room.
  get: (roomId: string, studentId: string, problemId?: string | null) =>
    api
      .get<StudentPerformance>(`/salas/${roomId}/alunos/${studentId}/desempenho`, {
        params: problemId ? { problemaId: problemId } : undefined,
      })
      .then((r) => r.data),
};
