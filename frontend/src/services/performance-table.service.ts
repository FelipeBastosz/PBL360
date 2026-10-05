import type {
  CreatePerformanceTablePayload,
  PerformanceTable,
  PerformanceTableSummary,
  UpdatePerformanceTablePayload,
} from '@/types/performanceTable';
import { api } from './api';
import { mockPerformanceTableService } from './mocks/performance-table.mock';

const BASE = '/tabelas-desempenho';

export type PerformanceTableService = {
  list: () => Promise<PerformanceTableSummary[]>;
  getById: (tableId: string) => Promise<PerformanceTable>;
  create: (payload: CreatePerformanceTablePayload) => Promise<PerformanceTable>;
  update: (tableId: string, payload: UpdatePerformanceTablePayload) => Promise<PerformanceTable>;
  remove: (tableId: string) => Promise<void>;
};

const httpPerformanceTableService: PerformanceTableService = {
  list: () => api.get<PerformanceTableSummary[]>(BASE).then((r) => r.data),

  getById: (tableId) => api.get<PerformanceTable>(`${BASE}/${tableId}`).then((r) => r.data),

  create: (payload) => api.post<PerformanceTable>(BASE, payload).then((r) => r.data),

  update: (tableId, payload) =>
    api.put<PerformanceTable>(`${BASE}/${tableId}`, payload).then((r) => r.data),

  remove: (tableId) => api.delete<void>(`${BASE}/${tableId}`).then(() => undefined),
};

export const performanceTableService: PerformanceTableService =
  import.meta.env.VITE_USE_MOCKS === 'true'
    ? mockPerformanceTableService
    : httpPerformanceTableService;

export { httpPerformanceTableService };
