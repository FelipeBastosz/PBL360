import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { GetPerformanceTableUsageUseCase } from './get-performance-table-usage.use-case';

describe('GetPerformanceTableUsageUseCase', () => {
  let repository: jest.Mocked<PerformanceTableRepository>;
  let useCase: GetPerformanceTableUsageUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findById: jest.fn(),
      findUsageById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    useCase = new GetPerformanceTableUsageUseCase(repository);
  });

  it('returns how many problems use the table', async () => {
    const table = new PerformanceTable();
    table.id = 'table-1';
    table.tutorId = 'tutor-1';

    repository.findById.mockResolvedValue(table);
    repository.findUsageById.mockResolvedValue({
      problemCount: 3,
    });

    await expect(
      useCase.execute({
        tableId: 'table-1',
        tutorId: 'tutor-1',
      }),
    ).resolves.toEqual({
      inUse: true,
      problemCount: 3,
    });
  });

  it('throws when performance table does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        tableId: 'table-1',
        tutorId: 'tutor-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws when tutor does not own the table', async () => {
    const table = new PerformanceTable();
    table.id = 'table-1';
    table.tutorId = 'other-tutor';

    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute({
        tableId: 'table-1',
        tutorId: 'tutor-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns table as not in use when there are no problems', async () => {
    const table = new PerformanceTable();
    table.id = 'table-1';
    table.tutorId = 'tutor-1';

    repository.findById.mockResolvedValue(table);
    repository.findUsageById.mockResolvedValue({
      problemCount: 0,
    });

    await expect(
      useCase.execute({
        tableId: 'table-1',
        tutorId: 'tutor-1',
      }),
    ).resolves.toEqual({
      inUse: false,
      problemCount: 0,
    });
  });
});
