import type { CreateProblemPayload, Problem } from '@/types/problem';
import { api } from './api';

const problemsOf = (roomId: string) => `/salas/${roomId}/problemas`;

export const problemService = {
  list: (roomId: string) => api.get<Problem[]>(problemsOf(roomId)).then((r) => r.data),

  getById: (roomId: string, problemId: string) =>
    api.get<Problem>(`${problemsOf(roomId)}/${problemId}`).then((r) => r.data),

  create: (roomId: string, payload: CreateProblemPayload) =>
    api.post<Problem>(problemsOf(roomId), payload).then((r) => r.data),
};
