import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { GetPerformanceTableUseCase } from './get-performance-table.use-case';

describe('GetPerformanceTableUseCase', () => {
  let useCase: GetPerformanceTableUseCase;
  let findByIdMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();

    const repository: jest.Mocked<PerformanceTableRepository> = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findById: findByIdMock,
      softDelete: jest.fn(),
      update: jest.fn(),
      findUsageById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    useCase = new GetPerformanceTableUseCase(repository);
  });

  it('returns performance table when found and user is the owner', async () => {
    const table = new PerformanceTable();
    table.id = 'table-uuid-1';
    table.tutorId = 'tutor-uuid-1';
    table.name = 'Barema PBL';
    table.criteria = [];

    findByIdMock.mockResolvedValueOnce(table);

    const result = await useCase.execute({
      tableId: 'table-uuid-1',
      tutorId: 'tutor-uuid-1',
    });

    expect(findByIdMock).toHaveBeenCalledWith('table-uuid-1');
    expect(result).toBe(table);
  });

  it('throws NotFoundError when table does not exist', async () => {
    findByIdMock.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        tableId: 'missing-id',
        tutorId: 'tutor-uuid-1',
      }),
    ).rejects.toThrow(new NotFoundError('Tabela de desempenho não encontrada.'));
  });

  it('throws ForbiddenError when user is not the table owner', async () => {
    const table = new PerformanceTable();
    table.id = 'table-uuid-1';
    table.tutorId = 'different-tutor';
    table.name = 'Barema PBL';

    findByIdMock.mockResolvedValueOnce(table);

    await expect(
      useCase.execute({
        tableId: 'table-uuid-1',
        tutorId: 'tutor-uuid-1',
      }),
    ).rejects.toThrow(
      new ForbiddenError('Você não tem permissão para acessar esta tabela de desempenho.'),
    );
  });
});
