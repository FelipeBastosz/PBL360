import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { DeletePerformanceTableUseCase } from './delete-performance-table.use-case';

describe('DeletePerformanceTableUseCase', () => {
  const tableId = 'table-uuid-1';
  const tutorId = 'tutor-uuid-1';
  let repository: jest.Mocked<PerformanceTableRepository>;
  let useCase: DeletePerformanceTableUseCase;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findTablesByRoom: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
      findUsageById: jest.fn().mockResolvedValue({ problemCount: 0, sessionCount: 0 }),
      findByIdIncludingDeleted: jest.fn(),
    };
    useCase = new DeletePerformanceTableUseCase(repository);
  });

  it('soft deletes a table when requested by its owner', async () => {
    const table = Object.assign(new PerformanceTable(), { id: tableId, tutorId, deletedAt: null });
    repository.findById.mockResolvedValue(table);
    repository.softDelete.mockResolvedValue(true);

    await useCase.execute({ tableId, tutorId });

    expect(repository.softDelete).toHaveBeenCalledWith(table);
    expect(table.deletedAt).toBeInstanceOf(Date);
  });

  it('rejects deletion when table has been used in sessions', async () => {
    const table = Object.assign(new PerformanceTable(), { id: tableId, tutorId, deletedAt: null });
    repository.findById.mockResolvedValue(table);
    repository.findUsageById.mockResolvedValue({ problemCount: 1, sessionCount: 2 });

    await expect(useCase.execute({ tableId, tutorId })).rejects.toBeInstanceOf(ConflictError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('allows deletion when table is linked to problems but has not been used in sessions', async () => {
    const table = Object.assign(new PerformanceTable(), { id: tableId, tutorId, deletedAt: null });
    repository.findById.mockResolvedValue(table);
    repository.findUsageById.mockResolvedValue({ problemCount: 1, sessionCount: 0 });
    repository.softDelete.mockResolvedValue(true);

    await useCase.execute({ tableId, tutorId });

    expect(repository.softDelete).toHaveBeenCalledWith(table);
    expect(table.deletedAt).toBeInstanceOf(Date);
  });

  it('rejects deletion by a tutor who does not own the table', async () => {
    repository.findById.mockResolvedValue(
      Object.assign(new PerformanceTable(), { tutorId: 'another-tutor' }),
    );

    await expect(useCase.execute({ tableId, tutorId })).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('reports missing and already deleted tables as not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ tableId, tutorId })).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('propagates persistence failures', async () => {
    const table = Object.assign(new PerformanceTable(), { id: tableId, tutorId, deletedAt: null });
    repository.findById.mockResolvedValue(table);
    repository.softDelete.mockRejectedValue(new Error('Database failure'));

    await expect(useCase.execute({ tableId, tutorId })).rejects.toThrow('Database failure');
  });
});
