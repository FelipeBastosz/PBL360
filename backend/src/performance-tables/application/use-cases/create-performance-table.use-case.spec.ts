import { InvalidPerformanceTableError } from '../../domain/errors/invalid-performance-table.error';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { CreatePerformanceTableUseCase } from './create-performance-table.use-case';

describe('CreatePerformanceTableUseCase', () => {
  let useCase: CreatePerformanceTableUseCase;
  let createMock: jest.Mock;

  beforeEach(() => {
    createMock = jest.fn();

    const repository: jest.Mocked<PerformanceTableRepository> = {
      create: createMock,
      findSummariesByTutorId: jest.fn(),
    };

    useCase = new CreatePerformanceTableUseCase(repository);
  });

  it('creates and persists a table with its criteria', async () => {
    const savedTable = { id: 'table-uuid-1' };
    createMock.mockResolvedValueOnce(savedTable);

    const result = await useCase.execute({
      tutorId: 'tutor-uuid-1',
      name: 'Avaliação tutorial',
      criteria: [{ name: 'Participação', orderIndex: 1, weight: 0.5 }],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: 'tutor-uuid-1',
        name: 'Avaliação tutorial',
        criteria: [expect.objectContaining({ name: 'Participação', orderIndex: 1, weight: 0.5 })],
      }),
    );
    expect(result).toBe(savedTable);
  });

  it('does not persist a table without criteria', async () => {
    await expect(
      useCase.execute({
        tutorId: 'tutor-uuid-1',
        name: 'Avaliação tutorial',
        criteria: [],
      }),
    ).rejects.toThrow(InvalidPerformanceTableError);

    expect(createMock).not.toHaveBeenCalled();
  });

  it('propagates persistence failures', async () => {
    createMock.mockRejectedValueOnce(new Error('DB connection failure'));

    await expect(
      useCase.execute({
        tutorId: 'tutor-uuid-1',
        name: 'Avaliação tutorial',
        criteria: [{ name: 'Participação' }],
      }),
    ).rejects.toThrow('DB connection failure');
  });
});
