import type {
  CreatePerformanceTablePayload,
  PerformanceTable,
  PerformanceTableSummary,
  RoomPerformanceTableItem,
  UpdatePerformanceTablePayload,
} from '@/types/performanceTable';
import { api } from './api';
import { mockPerformanceTableService } from './mocks/performance-table.mock';

const BASE = '/tabelas-desempenho';

function mapRoomItemToSummary(item: RoomPerformanceTableItem): PerformanceTableSummary {
  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? null,
    quantidadeCriterios: item.criterios.length,
    origem: item.origem,
    autor: item.autor,
    emUso: item.emUso,
  };
}

export type PerformanceTableService = {
  list: () => Promise<PerformanceTableSummary[]>;
  listByRoom: (roomId: string) => Promise<PerformanceTableSummary[]>;
  getById: (tableId: string) => Promise<PerformanceTable>;
  create: (payload: CreatePerformanceTablePayload) => Promise<PerformanceTable>;
  update: (tableId: string, payload: UpdatePerformanceTablePayload) => Promise<PerformanceTable>;
  remove: (tableId: string) => Promise<void>;
};

const httpPerformanceTableService: PerformanceTableService = {
  list: () => api.get<PerformanceTableSummary[]>(BASE).then((r) => r.data),

  listByRoom: (roomId: string) =>
    api
      .get<RoomPerformanceTableItem[]>(`/salas/${roomId}/tabelas-desempenho`)
      .then((r) => r.data.map(mapRoomItemToSummary)),

  getById: (tableId) => api.get<PerformanceTable>(`${BASE}/${tableId}`).then((r) => r.data),

  create: ({ roomId, ...body }) => {
    const url = roomId ? `/salas/${roomId}/tabelas-desempenho` : BASE;
    return api.post<PerformanceTable>(url, body).then((r) => r.data);
  },

  update: (tableId, payload) =>
    api.put<PerformanceTable>(`${BASE}/${tableId}`, payload).then((r) => r.data),

  remove: (tableId) => api.delete<void>(`${BASE}/${tableId}`).then(() => undefined),
};

export const performanceTableService: PerformanceTableService =
  import.meta.env.VITE_USE_MOCKS === 'true'
    ? mockPerformanceTableService
    : httpPerformanceTableService;

export { httpPerformanceTableService };
