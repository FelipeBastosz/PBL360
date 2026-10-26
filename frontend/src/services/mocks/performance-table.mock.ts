import type {
  CreatePerformanceTablePayload,
  PerformanceTable,
  PerformanceTableSummary,
  UpdatePerformanceTablePayload,
} from '@/types/performanceTable';
import type { PerformanceTableService } from '../performance-table.service';

const TUTOR_ID = 'mock-tutor-1';
const NOW = '2026-09-01T10:00:00.000Z';

function buildCriteria(tableId: string, items: Array<[string, number]>) {
  return items.map(([nome, peso], index) => ({
    id: `${tableId}-criterion-${index + 1}`,
    nome,
    descricao: null,
    peso,
    ordem: index + 1,
  }));
}

function seedTables(): PerformanceTable[] {
  return [
    {
      id: 'mock-table-1',
      professorId: TUTOR_ID,
      nome: 'Barema PBL',
      descricao: 'Critérios padrão do módulo de Algoritmos.',
      quantidadeProblemas: 2,
      criterios: buildCriteria('mock-table-1', [
        ['Domínio do tema', 3],
        ['Uso de fontes', 2],
        ['Contribuição', 2],
        ['Escuta ativa', 1],
        ['Pontualidade', 1],
        ['Postura', 1],
      ]),
      criadoEm: NOW,
      atualizadoEm: NOW,
    },
    {
      id: 'mock-table-2',
      professorId: TUTOR_ID,
      nome: 'Avaliação de sessão curta',
      descricao: null,
      quantidadeProblemas: 0,
      criterios: buildCriteria('mock-table-2', [
        ['Domínio do tema', 3],
        ['Contribuição', 2],
        ['Postura', 1],
      ]),
      criadoEm: NOW,
      atualizadoEm: NOW,
    },
  ];
}

function toSummary(table: PerformanceTable): PerformanceTableSummary {
  return {
    id: table.id,
    nome: table.nome,
    descricao: table.descricao,
    quantidadeCriterios: table.criterios.length,
    quantidadeProblemas: table.quantidadeProblemas,
    criadoEm: table.criadoEm,
    atualizadoEm: table.atualizadoEm,
  };
}

function withCriteria(tableId: string, payload: CreatePerformanceTablePayload['criterios']) {
  return payload.map((criterion, index) => ({
    id: `${tableId}-criterion-${index + 1}`,
    nome: criterion.nome,
    descricao: criterion.descricao ?? null,
    peso: criterion.peso,
    ordem: criterion.ordem,
  }));
}

export function createMockPerformanceTableService(): PerformanceTableService {
  let tables = seedTables();
  let sequence = tables.length;

  const find = (tableId: string): PerformanceTable => {
    const table = tables.find((item) => item.id === tableId);
    if (!table) {
      throw new Error('Tabela de desempenho não encontrada.');
    }
    return table;
  };

  return {
    list: async () => tables.map(toSummary),

    listByRoom: async (_roomId: string) => tables.map(toSummary),

    getById: async (tableId) => structuredClone(find(tableId)),

    create: async (payload: CreatePerformanceTablePayload) => {
      sequence += 1;
      const id = `mock-table-${sequence}`;
      const table: PerformanceTable = {
        id,
        professorId: TUTOR_ID,
        nome: payload.nome,
        descricao: payload.descricao ?? null,
        quantidadeProblemas: 0,
        criterios: withCriteria(id, payload.criterios),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      tables = [...tables, table];
      return structuredClone(table);
    },

    update: async (tableId, payload: UpdatePerformanceTablePayload) => {
      const current = find(tableId);
      const updated: PerformanceTable = {
        ...current,
        nome: payload.nome ?? current.nome,
        descricao: payload.descricao ?? current.descricao,
        criterios: payload.criterios ? withCriteria(tableId, payload.criterios) : current.criterios,
        atualizadoEm: new Date().toISOString(),
      };
      tables = tables.map((item) => (item.id === tableId ? updated : item));
      return structuredClone(updated);
    },

    remove: async (tableId) => {
      find(tableId);
      tables = tables.filter((item) => item.id !== tableId);
    },
  };
}

export const mockPerformanceTableService = createMockPerformanceTableService();
