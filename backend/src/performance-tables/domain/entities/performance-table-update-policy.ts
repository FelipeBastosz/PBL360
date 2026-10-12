import { InvalidPerformanceTableError } from '../errors/invalid-performance-table.error';
import type { PerformanceTable } from './performance-table.entity';

export function assertOnlyWeightsChanged(
  current: Pick<PerformanceTable, 'name' | 'description' | 'criteria'>,
  candidate: Pick<PerformanceTable, 'name' | 'description' | 'criteria'>,
): void {
  const metadataChanged =
    candidate.name !== current.name || candidate.description !== current.description;
  if (metadataChanged || criteriaChanged(current.criteria, candidate.criteria)) {
    throw new InvalidPerformanceTableError(
      'Esta tabela já foi usada em sessão passada. Somente os pesos podem ser alterados.',
    );
  }
}

function criteriaChanged(
  currentCriteria: PerformanceTable['criteria'],
  candidateCriteria: PerformanceTable['criteria'],
): boolean {
  if (candidateCriteria.length !== currentCriteria.length) return true;
  const currentById = new Map(currentCriteria.map((criterion) => [criterion.id, criterion]));
  return candidateCriteria.some((criterion) => hasNonWeightChange(criterion, currentById));
}

function hasNonWeightChange(
  criterion: PerformanceTable['criteria'][number],
  currentById: Map<string, PerformanceTable['criteria'][number]>,
): boolean {
  const previous = currentById.get(criterion.id);
  return (
    !previous ||
    criterion.name !== previous.name ||
    criterion.description !== previous.description ||
    criterion.orderIndex !== previous.orderIndex
  );
}

export function assertDefaultTableCanBeUpdated(
  current: Pick<PerformanceTable, 'isDefault' | 'name' | 'description' | 'criteria'>,
  candidate: Pick<PerformanceTable, 'name' | 'description' | 'criteria'>,
): void {
  if (!current.isDefault) return;

  if (candidate.name !== current.name || candidate.description !== current.description) {
    throw new InvalidPerformanceTableError(
      'O nome e a descrição da tabela padrão não podem ser alterados.',
    );
  }

  assertDefaultCriteriaUnchanged(current.criteria, candidate.criteria);
}

function assertDefaultCriteriaUnchanged(
  currentCriteria: PerformanceTable['criteria'],
  candidateCriteria: PerformanceTable['criteria'],
): void {
  if (criteriaChanged(currentCriteria, candidateCriteria)) {
    throw new InvalidPerformanceTableError(
      'Os nomes, descrições e ordens dos critérios da tabela padrão não podem ser alterados.',
    );
  }
}
