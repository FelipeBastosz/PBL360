import type { TutorSummary } from '@/types/room';
import { api } from './api';

const BASE = '/usuarios';

export const userService = {
  getPhoto: (userId: string) =>
    api.get<Blob>(`${BASE}/${userId}/foto`, { responseType: 'blob' }).then((r) => r.data),

  searchTutors: (busca: string) =>
    api.get<TutorSummary[]>(`${BASE}/professores`, { params: { busca } }).then((r) => r.data),
};
