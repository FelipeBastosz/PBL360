import { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import { toPerformanceTableWithCriteria } from './performance-table-detail.mapper';

describe('toPerformanceTableWithCriteria', () => {
  const base = {
    id: 'table-1',
    tutorId: 't1',
    name: 'Barema',
    description: null,
    isDefault: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
    deletedAt: null,
    problemCount: '3',
    criterionId: null,
    criterionName: null,
    criterionDescription: null,
    criterionOrderIndex: null,
    criterionWeight: null,
  };

  it('maps table metadata, applies nullable defaults and skips rows without a criterion', () => {
    const table = toPerformanceTableWithCriteria([
      {
        ...base,
        roomId: undefined,
        sourceTableId: undefined,
        isSessionCopy: undefined,
      },
    ]);
    expect(table).toBeInstanceOf(PerformanceTable);
    expect(table).toMatchObject({
      id: 'table-1',
      roomId: null,
      sourceTableId: null,
      isSessionCopy: false,
      problemCount: 3,
      criteria: [],
    });
  });

  it('converts criterion values and attaches each criterion to its table', () => {
    const table = toPerformanceTableWithCriteria([
      {
        ...base,
        criterionId: 'c1',
        criterionName: 'Presença',
        criterionDescription: 'Participação',
        criterionOrderIndex: 1,
        criterionWeight: '2.5',
      },
      {
        ...base,
        criterionId: 'c2',
        criterionName: 'Colaboração',
        criterionDescription: null,
        criterionOrderIndex: '2',
        criterionWeight: 3,
      },
    ]);
    expect(table.criteria).toHaveLength(2);
    expect(table.criteria[0]).toBeInstanceOf(PerformanceCriterion);
    expect(table.criteria[0]).toMatchObject({
      id: 'c1',
      performanceTableId: 'table-1',
      name: 'Presença',
      description: 'Participação',
      orderIndex: 1,
      weight: 2.5,
      performanceTable: table,
    });
    expect(table.criteria[1]).toMatchObject({
      id: 'c2',
      orderIndex: 2,
      weight: 3,
      description: null,
    });
  });
});
