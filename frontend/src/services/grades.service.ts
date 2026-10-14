import { api } from './api';
import type { ProblemGradesResponse } from '@/types/grades';

export const gradesService = {
  getProblemGrades: (roomId: string, problemId: string): Promise<ProblemGradesResponse> =>
    api
      .get<ProblemGradesResponse>(`/salas/${roomId}/problemas/${problemId}/notas`)
      .then((r) => r.data),
};
