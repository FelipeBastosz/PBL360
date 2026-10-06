import { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';

export interface PerformanceTableDetailRow {
  id: string;
  tutorId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  problemCount: number;
  criterionId: string | null;
  criterionName: string | null;
  criterionDescription: string | null;
  criterionOrderIndex: number | null;
  criterionWeight: string | number | null;
}

export function toPerformanceTableWithCriteria(
  rows: PerformanceTableDetailRow[],
): PerformanceTable {
  const first = rows[0]!;
  const table = new PerformanceTable();

  table.id = first.id;
  table.tutorId = first.tutorId;
  table.name = first.name;
  table.description = first.description;
  table.isDefault = first.isDefault;
  table.createdAt = first.createdAt;
  table.updatedAt = first.updatedAt;
  table.deletedAt = first.deletedAt;
  table.problemCount = Number(first.problemCount ?? 0);
  table.criteria = extractCriteria(rows, table);

  return table;
}

function extractCriteria(
  rows: PerformanceTableDetailRow[],
  table: PerformanceTable,
): PerformanceCriterion[] {
  return rows.filter((row) => row.criterionId !== null).map((row) => toCriterion(row, table));
}

function toCriterion(
  row: PerformanceTableDetailRow,
  table: PerformanceTable,
): PerformanceCriterion {
  const criterion = new PerformanceCriterion();

  criterion.id = row.criterionId!;
  criterion.performanceTableId = table.id;
  criterion.name = row.criterionName!;
  criterion.description = row.criterionDescription;
  criterion.orderIndex = Number(row.criterionOrderIndex);
  criterion.weight = Number(row.criterionWeight);
  criterion.performanceTable = table;

  return criterion;
}
