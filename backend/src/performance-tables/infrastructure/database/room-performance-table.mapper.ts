import {
  PerformanceTableOrigin,
  type RoomPerformanceTableItem,
} from '../../domain/repositories/performance-table.repository';

export interface RoomPerformanceTableRow {
  id: string;
  name: string;
  description: string | null;
  roomId: string | null;
  isDefault: boolean;
  authorId: string | null;
  authorName: string;
  createdAt: Date;
  emUso: number;
  criterionId: string | null;
  criterionName: string | null;
  criterionDescription: string | null;
  criterionOrderIndex: number | null;
  criterionWeight: string | number | null;
  criterionMaxScore?: string | number | null;
}

export function toRoomPerformanceTableItems(
  rows: RoomPerformanceTableRow[],
  roomId: string,
): RoomPerformanceTableItem[] {
  const tablesMap = new Map<string, RoomPerformanceTableItem>();

  for (const row of rows) {
    const item = tablesMap.get(row.id) ?? createTableItem(row, roomId);
    tablesMap.set(row.id, item);
    appendCriterion(item, row);
  }

  return Array.from(tablesMap.values());
}

function createTableItem(row: RoomPerformanceTableRow, roomId: string): RoomPerformanceTableItem {
  return {
    id: row.id,
    nome: row.name,
    descricao: row.description,
    origem: resolveOrigin(row, roomId),
    autor: { id: row.authorId, nome: row.authorName },
    criterios: [],
    emUso: Number(row.emUso ?? 0),
  };
}

function appendCriterion(item: RoomPerformanceTableItem, row: RoomPerformanceTableRow): void {
  if (!row.criterionId) return;

  item.criterios.push({
    id: row.criterionId,
    nome: row.criterionName!,
    descricao: row.criterionDescription,
    ordem: Number(row.criterionOrderIndex),
    peso: Number(row.criterionWeight),
    notaMaxima: Number(row.criterionMaxScore ?? 10),
  });
}

function resolveOrigin(row: RoomPerformanceTableRow, roomId: string): PerformanceTableOrigin {
  if (row.isDefault) {
    return PerformanceTableOrigin.PADRAO;
  }

  if (row.roomId === roomId) {
    return PerformanceTableOrigin.TURMA;
  }

  if (row.roomId === null) {
    return PerformanceTableOrigin.PESSOAL;
  }

  return PerformanceTableOrigin.TURMA;
}
