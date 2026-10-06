import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { InvalidPerformanceTableError } from '../../domain/errors/invalid-performance-table.error';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { UpdatePerformanceTableUseCase } from './update-performance-table.use-case';

describe('UpdatePerformanceTableUseCase', () => {
  let repository: jest.Mocked<PerformanceTableRepository>;
  let useCase: UpdatePerformanceTableUseCase;

  const tableId = 'table-1';
  const tutorId = 'tutor-1';

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findUsageById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    useCase = new UpdatePerformanceTableUseCase(repository);
  });

  it('updates a performance table', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema antigo',
      criteria: [
        {
          name: 'Participação',
          orderIndex: 1,
          weight: 10,
        },
      ],
    });

    table.id = tableId;

    repository.findById.mockResolvedValue(table);
    repository.update.mockImplementation((table) => Promise.resolve(table));

    const result = await useCase.execute(tableId, tutorId, {
      name: 'Barema atualizado',
      description: 'Nova configuração',
      criteria: [
        {
          name: 'Domínio do conteúdo',
          orderIndex: 1,
          weight: 6,
        },
        {
          name: 'Participação',
          orderIndex: 2,
          weight: 4,
        },
      ],
    });

    expect(repository.findById).toHaveBeenCalledWith(tableId);
    expect(repository.update).toHaveBeenCalledWith(table);

    expect(result.name).toBe('Barema atualizado');
    expect(result.description).toBe('Nova configuração');
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0]?.name).toBe('Domínio do conteúdo');
    expect(result.criteria[1]?.name).toBe('Participação');
  });

  it('throws NotFoundError when the table does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: 'Barema atualizado',
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow(NotFoundError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when the tutor does not own the table', async () => {
    const table = PerformanceTable.create({
      tutorId: 'another-tutor',
      name: 'Barema',
      criteria: [{ name: 'Participação', weight: 10 }],
    });

    table.id = tableId;
    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: 'Barema atualizado',
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects an empty table name', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [{ name: 'Participação', weight: 10 }],
    });

    table.id = tableId;
    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: '   ',
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow(InvalidPerformanceTableError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects a table without criteria', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [{ name: 'Participação', weight: 10 }],
    });

    table.id = tableId;
    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: 'Barema atualizado',
        criteria: [],
      }),
    ).rejects.toThrow(InvalidPerformanceTableError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects updating a table when criteria weights do not sum to 10', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [{ name: 'Postura', weight: 10 }],
    });
    table.id = tableId;
    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: 'Barema atualizado',
        criteria: [{ name: 'Postura', weight: 8 }],
      }),
    ).rejects.toThrow(InvalidPerformanceTableError);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('persists retained ids and new criteria while omitting removed criteria', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [
        { name: 'Participação', weight: 5 },
        { name: 'Postura', weight: 5 },
      ],
    });
    table.id = tableId;
    table.criteria[0]!.id = 'retained-id';
    table.criteria[1]!.id = 'removed-id';
    repository.findById.mockResolvedValue(table);
    repository.update.mockImplementation((updated) => Promise.resolve(updated));

    const result = await useCase.execute(tableId, tutorId, {
      name: 'Barema atualizado',
      criteria: [
        { id: 'retained-id', name: 'Participação nas discussões', weight: 6 },
        { name: 'Evolução', weight: 4 },
      ],
    });

    expect(repository.update).toHaveBeenCalledWith(table);
    expect(result.criteria.map((criterion) => criterion.id)).toEqual(['retained-id', undefined]);
    expect(result.criteria[0]!.name).toBe('Participação nas discussões');
  });

  it.each([
    { criteria: [{ id: 'foreign-id', name: 'Outro critério', weight: 10 }] },
    {
      criteria: [
        { id: 'criterion-1', name: 'Primeiro', weight: 5 },
        { id: 'criterion-1', name: 'Segundo', weight: 5 },
      ],
    },
  ])('does not persist invalid criterion identities: %j', async ({ criteria }) => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [{ name: 'Postura', weight: 10 }],
    });
    table.criteria[0]!.id = 'criterion-1';
    repository.findById.mockResolvedValue(table);

    await expect(
      useCase.execute(tableId, tutorId, { name: 'Novo nome', criteria }),
    ).rejects.toThrow(InvalidPerformanceTableError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('propagates a persistence failure instead of returning success', async () => {
    const table = PerformanceTable.create({
      tutorId,
      name: 'Barema',
      criteria: [{ name: 'Postura', weight: 10 }],
    });
    repository.findById.mockResolvedValue(table);
    const failure = new Error('Database unavailable');
    repository.update.mockRejectedValue(failure);

    await expect(
      useCase.execute(tableId, tutorId, {
        name: 'Novo nome',
        criteria: [{ name: 'Evolução', weight: 10 }],
      }),
    ).rejects.toBe(failure);
  });
});
