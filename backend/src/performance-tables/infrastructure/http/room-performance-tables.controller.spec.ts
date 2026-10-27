import { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import {
  PerformanceTableOrigin,
  type RoomPerformanceTableItem,
} from '../../domain/repositories/performance-table.repository';
import type { CreatePerformanceTableUseCase } from '../../application/use-cases/create-performance-table.use-case';
import type { ListRoomPerformanceTablesUseCase } from '../../application/use-cases/list-room-performance-tables.use-case';
import { RoomPerformanceTablesController } from './room-performance-tables.controller';

describe('RoomPerformanceTablesController', () => {
  let controller: RoomPerformanceTablesController;
  let listRoomPerformanceTablesUseCase: jest.Mocked<ListRoomPerformanceTablesUseCase>;
  let createPerformanceTableUseCase: jest.Mocked<CreatePerformanceTableUseCase>;

  const roomId = 'room-uuid-1';
  const tutorId = 'tutor-uuid-1';

  beforeEach(() => {
    listRoomPerformanceTablesUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListRoomPerformanceTablesUseCase>;

    createPerformanceTableUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreatePerformanceTableUseCase>;

    controller = new RoomPerformanceTablesController(
      listRoomPerformanceTablesUseCase,
      createPerformanceTableUseCase,
    );
  });

  describe('list', () => {
    it('returns the list of tables available in the room', async () => {
      const mockItems: RoomPerformanceTableItem[] = [
        {
          id: 'table-1',
          nome: 'Tabela Turma',
          descricao: null,
          origem: PerformanceTableOrigin.TURMA,
          autor: { id: tutorId, nome: 'Professor' },
          criterios: [
            { id: 'c1', nome: 'Critério 1', descricao: null, ordem: 1, peso: 10, notaMaxima: 10 },
          ],
          emUso: 2,
        },
      ];

      listRoomPerformanceTablesUseCase.execute.mockResolvedValue(mockItems);

      const result = await controller.list(roomId, tutorId);

      expect(listRoomPerformanceTablesUseCase.execute).toHaveBeenCalledWith({ roomId, tutorId });
      expect(result).toEqual(mockItems);
    });
  });

  describe('create', () => {
    it('creates a performance table associated with the room and returns response dto', async () => {
      const table = new PerformanceTable();
      table.id = 'table-uuid-1';
      table.tutorId = tutorId;
      table.roomId = roomId;
      table.name = 'Nova Tabela da Turma';
      table.description = 'Descrição da tabela';
      table.isDefault = false;
      table.createdAt = new Date('2026-10-01T10:00:00Z');
      table.updatedAt = new Date('2026-10-01T10:00:00Z');
      table.problemCount = 0;

      const criterion = Object.assign(new PerformanceCriterion(), {
        id: 'crit-1',
        name: 'Critério 1',
        description: null,
        orderIndex: 1,
        weight: 10,
        createdAt: new Date('2026-10-01T10:00:00Z'),
        updatedAt: new Date('2026-10-01T10:00:00Z'),
      });
      table.criteria = [criterion];

      createPerformanceTableUseCase.execute.mockResolvedValue(table);

      const dto = {
        nome: 'Nova Tabela da Turma',
        descricao: 'Descrição da tabela',
        criterios: [{ nome: 'Critério 1', ordem: 1, peso: 10 }],
      };

      const result = await controller.create(roomId, dto, tutorId);

      expect(createPerformanceTableUseCase.execute).toHaveBeenCalledWith({
        tutorId,
        roomId,
        name: 'Nova Tabela da Turma',
        description: 'Descrição da tabela',
        criteria: [{ name: 'Critério 1', orderIndex: 1, weight: 10, description: undefined }],
      });

      expect(result.id).toBe('table-uuid-1');
      expect(result.nome).toBe('Nova Tabela da Turma');
      expect(result.criterios).toHaveLength(1);
    });
  });
});
