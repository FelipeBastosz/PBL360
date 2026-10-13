import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { PerformanceTable } from './performance-table.entity';

export function assertPerformanceTableIsValid(table: PerformanceTable): void {
  if (!table.tutorId) {
    throw new InvalidPerformanceTableError('O professor responsável é obrigatório.');
  }
  if (!table.name) {
    throw new InvalidPerformanceTableError('O nome da tabela de desempenho é obrigatório.');
  }
  if (table.name.length > 120) {
    throw new InvalidPerformanceTableError(
      'O nome da tabela de desempenho deve ter no máximo 120 caracteres.',
    );
  }
  if (table.criteria.length === 0) {
    throw new InvalidPerformanceTableError(
      'A tabela de desempenho deve possuir ao menos um critério.',
    );
  }
  assertCriteriaHaveUniqueOrderIndexes(table);
  assertCriteriaWeightsSumToTen(table);
}

function assertCriteriaHaveUniqueOrderIndexes(table: PerformanceTable): void {
  const orderIndexes = table.criteria.map((criterion) => criterion.orderIndex);
  if (new Set(orderIndexes).size !== orderIndexes.length) {
    throw new InvalidPerformanceTableError(
      'Os critérios da tabela de desempenho não podem repetir a ordem.',
    );
  }
}

function assertCriteriaWeightsSumToTen(table: PerformanceTable): void {
  const totalWeight = table.criteria.reduce(
    (sum, criterion) => sum + Number(criterion.weight ?? 0),
    0,
  );
  if (Number.isNaN(totalWeight) || Math.abs(totalWeight - 10) > 0.0001) {
    throw new InvalidPerformanceTableError('A soma dos pesos dos critérios deve ser igual a 10.');
  }
}
