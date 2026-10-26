import type { CreateDisciplinePayload, Discipline } from '@/types/discipline';
import { api } from './api';

const BASE = '/disciplinas';

export const disciplineService = {
  list: () => api.get<Discipline[]>(BASE).then((r) => r.data),

  create: (payload: CreateDisciplinePayload) =>
    api.post<Discipline>(BASE, payload).then((r) => r.data),
};
