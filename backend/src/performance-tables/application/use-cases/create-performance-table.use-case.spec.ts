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
      findById: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
      findUsageById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    useCase = new CreatePerformanceTableUseCase(repository);
  });

  it('creates and persists a table with its criteria', async () => {
    const savedTable = { id: 'table-uuid-1' };
    createMock.mockResolvedValueOnce(savedTable);

    const result = await useCase.execute({
      tutorId: 'tutor-uuid-1',
      name: 'Avaliação tutorial',
      criteria: [{ name: 'Participação', orderIndex: 1, weight: 10 }],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: 'tutor-uuid-1',
        name: 'Avaliação tutorial',
        criteria: [expect.objectContaining({ name: 'Participação', orderIndex: 1, weight: 10 })],
      }),
    );
    expect(result).toBe(savedTable);
  });

  it('creates the protected default table with the standard criteria', async () => {
    const savedTable = { id: 'default-table-uuid' };
    createMock.mockResolvedValueOnce(savedTable);

    await expect(useCase.executeDefault('tutor-uuid-1')).resolves.toBe(savedTable);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: 'tutor-uuid-1',
        name: 'Fórmula Padrão',
        description: 'Critérios padrão de avaliação.',
        isDefault: true,
        criteria: [
          expect.objectContaining({ name: 'Seguimento', weight: 3 }),
          expect.objectContaining({ name: 'Comportamento', weight: 3 }),
          expect.objectContaining({ name: 'Participação', weight: 4 }),
        ],
      }),
    );
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

  it('does not persist a table when criteria weights do not sum to 10', async () => {
    await expect(
      useCase.execute({
        tutorId: 'tutor-uuid-1',
        name: 'Avaliação tutorial',
        criteria: [{ name: 'Participação', weight: 5 }],
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
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow('DB connection failure');
  });
});
