import { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableSummary } from '../../domain/repositories/performance-table.repository';
import type { CreatePerformanceTableUseCase } from '../../application/use-cases/create-performance-table.use-case';
import type { DeletePerformanceTableUseCase } from '../../application/use-cases/delete-performance-table.use-case';
import type { GetPerformanceTableUseCase } from '../../application/use-cases/get-performance-table.use-case';
import type { ListPerformanceTablesUseCase } from '../../application/use-cases/list-performance-tables.use-case';
import { PerformanceTablesController } from './performance-tables.controller';

describe('PerformanceTablesController', () => {
  let controller: PerformanceTablesController;
  let createUseCase: jest.Mocked<CreatePerformanceTableUseCase>;
  let listUseCase: jest.Mocked<ListPerformanceTablesUseCase>;
  let getUseCase: jest.Mocked<GetPerformanceTableUseCase>;
  let deleteUseCase: jest.Mocked<DeletePerformanceTableUseCase>;

  const mockDate = new Date('2026-03-01T12:00:00Z');

  beforeEach(() => {
    createUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreatePerformanceTableUseCase>;

    listUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListPerformanceTablesUseCase>;

    getUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPerformanceTableUseCase>;

    deleteUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeletePerformanceTableUseCase>;

    controller = new PerformanceTablesController(
      createUseCase,
      listUseCase,
      getUseCase,
      deleteUseCase,
    );
  });

  it('creates a performance table and returns response dto', async () => {
    const table = new PerformanceTable();
    table.id = 'table-uuid-1';
    table.tutorId = 'tutor-uuid-1';
    table.name = 'Barema PBL';
    table.description = 'Desc';
    const criterion = Object.assign(new PerformanceCriterion(), {
      id: 'crit-1',
      name: 'Domínio',
      description: null,
      orderIndex: 1,
      weight: 3,
    });
    table.criteria = [criterion];
    table.createdAt = mockDate;
    table.updatedAt = mockDate;

    createUseCase.execute.mockResolvedValueOnce(table);

    const result = await controller.create(
      {
        nome: 'Barema PBL',
        descricao: 'Desc',
        criterios: [{ nome: 'Domínio', ordem: 1, peso: 3 }],
      },
      'tutor-uuid-1',
    );

    expect(createUseCase.execute).toHaveBeenCalledWith({
      tutorId: 'tutor-uuid-1',
      name: 'Barema PBL',
      description: 'Desc',
      criteria: [{ name: 'Domínio', description: undefined, orderIndex: 1, weight: 3 }],
    });
    expect(result).toEqual({
      id: 'table-uuid-1',
      professorId: 'tutor-uuid-1',
      nome: 'Barema PBL',
      descricao: 'Desc',
      quantidadeProblemas: 0,
      criterios: [
        {
          id: 'crit-1',
          nome: 'Domínio',
          descricao: null,
          ordem: 1,
          peso: 3,
        },
      ],
      criadoEm: mockDate,
      atualizadoEm: mockDate,
    });
  });

  it('lists performance tables for authenticated tutor', async () => {
    const summaries: PerformanceTableSummary[] = [
      {
        id: 'table-uuid-1',
        tutorId: 'tutor-uuid-1',
        name: 'Barema PBL',
        description: null,
        criteriaCount: 3,
        problemCount: 2,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    ];

    listUseCase.execute.mockResolvedValueOnce(summaries);

    const result = await controller.list('tutor-uuid-1');

    expect(listUseCase.execute).toHaveBeenCalledWith('tutor-uuid-1');
    expect(result).toEqual([
      {
        id: 'table-uuid-1',
        professorId: 'tutor-uuid-1',
        nome: 'Barema PBL',
        descricao: null,
        quantidadeCriterios: 3,
        quantidadeProblemas: 2,
        criadoEm: mockDate,
        atualizadoEm: mockDate,
      },
    ]);
  });

  it('retrieves performance table by id with its criteria', async () => {
    const table = new PerformanceTable();
    table.id = 'table-uuid-1';
    table.tutorId = 'tutor-uuid-1';
    table.name = 'Barema PBL';
    table.description = null;
    table.problemCount = 2;
    const criterion = Object.assign(new PerformanceCriterion(), {
      id: 'crit-1',
      name: 'Critério 1',
      description: 'Desc 1',
      orderIndex: 1,
      weight: 5,
    });
    table.criteria = [criterion];
    table.createdAt = mockDate;
    table.updatedAt = mockDate;

    getUseCase.execute.mockResolvedValueOnce(table);

    const result = await controller.getById('table-uuid-1', 'tutor-uuid-1');

    expect(getUseCase.execute).toHaveBeenCalledWith({
      tableId: 'table-uuid-1',
      tutorId: 'tutor-uuid-1',
    });
    expect(result).toEqual({
      id: 'table-uuid-1',
      professorId: 'tutor-uuid-1',
      nome: 'Barema PBL',
      descricao: null,
      quantidadeProblemas: 2,
      criterios: [
        {
          id: 'crit-1',
          nome: 'Critério 1',
          descricao: 'Desc 1',
          ordem: 1,
          peso: 5,
        },
      ],
      criadoEm: mockDate,
      atualizadoEm: mockDate,
    });
  });

  it('deletes a performance table', async () => {
    deleteUseCase.execute.mockResolvedValueOnce(undefined);

    await controller.delete('table-uuid-1', 'tutor-uuid-1');

    expect(deleteUseCase.execute).toHaveBeenCalledWith('table-uuid-1', 'tutor-uuid-1');
  });
});
