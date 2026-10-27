import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { ListPerformanceTablesUseCase } from './list-performance-tables.use-case';

describe('ListPerformanceTablesUseCase', () => {
  it('lists summaries for the authenticated tutor', async () => {
    const summaries = [
      {
        id: 'table-1',
        tutorId: 'tutor-1',
        name: 'Barema PBL',
        description: null,
        isDefault: false,
        criteriaCount: 3,
        problemCount: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];

    const repository: jest.Mocked<PerformanceTableRepository> = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findUsageById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    repository.findSummariesByTutorId.mockResolvedValue(summaries);

    const useCase = new ListPerformanceTablesUseCase(repository);

    await expect(useCase.execute('tutor-1')).resolves.toEqual(summaries);

    expect(repository.findSummariesByTutorId).toHaveBeenCalledWith('tutor-1');
  });
});
