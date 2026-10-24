import type { Discipline } from '@/types/discipline';
import { api } from './api';

export const disciplineService = {
  list: () => api.get<Discipline[]>('/disciplinas').then((r) => r.data),
};
