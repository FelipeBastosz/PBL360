import type { Repository } from 'typeorm';

import { Problem } from '../../domain/entities/problem.entity';
import { PgProblemRepository } from './pg-problem.repository';

describe('PgProblemRepository', () => {
  let repository: PgProblemRepository;
  let typeormRepo: jest.Mocked<Repository<Problem>>;

  const fakeProblemRow = (overrides = {}) => ({
    id: 'prob-uuid-1',
    roomId: 'room-uuid-1',
    title: 'Problema 1',
    description: 'Descrição do problema',
    orderIndex: 1,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-15'),
    selfEvalReleased: false,
    peerEvalReleased: false,
    releasedAt: null,
    selfEvalDeadline: null,
    createdBy: 'tutor-uuid-1',
    createdAt: new Date('2026-02-20T10:00:00Z'),
    updatedAt: new Date('2026-02-20T10:00:00Z'),
    ...overrides,
  });

  let queryMock: jest.Mock;

  beforeEach(() => {
    queryMock = jest.fn();
    typeormRepo = {
      query: queryMock,
      manager: {
        transaction: jest.fn(),
      },
    } as unknown as jest.Mocked<Repository<Problem>>;

    repository = new PgProblemRepository(typeormRepo);
  });

  describe('findById', () => {
    it('returns the problem when found', async () => {
      typeormRepo.query.mockResolvedValueOnce([fakeProblemRow()]);

      const result = await repository.findById('prob-uuid-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('prob-uuid-1');
      expect(result?.title).toBe('Problema 1');
      expect(result?.orderIndex).toBe(1);
    });

    it('returns null when problem is not found', async () => {
      typeormRepo.query.mockResolvedValueOnce([]);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByRoomId', () => {
    it('returns list of problems for the given room ordered', async () => {
      typeormRepo.query.mockResolvedValueOnce([
        fakeProblemRow({ id: 'p1', orderIndex: 1 }),
        fakeProblemRow({ id: 'p2', orderIndex: 2 }),
      ]);

      const result = await repository.findByRoomId('room-uuid-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p2');
    });

    it('returns empty array when room has no problems', async () => {
      typeormRepo.query.mockResolvedValueOnce([]);

      const result = await repository.findByRoomId('empty-room');

      expect(result).toEqual([]);
    });
  });

  describe('countByRoomId', () => {
    it('returns the number of problems in the room', async () => {
      typeormRepo.query.mockResolvedValueOnce([{ count: 3 }]);

      const result = await repository.countByRoomId('room-uuid-1');

      expect(result).toBe(3);
    });

    it('returns 0 when no problems exist', async () => {
      typeormRepo.query.mockResolvedValueOnce([]);

      const result = await repository.countByRoomId('room-uuid-1');

      expect(result).toBe(0);
    });
  });

  describe('getNextOrderIndex', () => {
    it('returns next available order index', async () => {
      typeormRepo.query.mockResolvedValueOnce([{ nextOrder: 4 }]);

      const result = await repository.getNextOrderIndex('room-uuid-1');

      expect(result).toBe(4);
    });
  });

  describe('save', () => {
    it('inserts a new problem, locking the room row and calculating next order index', async () => {
      const mockManager = {
        query: jest.fn(),
      };

      (typeormRepo.manager.transaction as jest.Mock).mockImplementationOnce(
        async (cb: (manager: typeof mockManager) => Promise<Problem>) => cb(mockManager),
      );

      mockManager.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ nextOrder: 1 }])
        .mockResolvedValueOnce([fakeProblemRow({ orderIndex: 1 })]);

      const newProblem = Problem.create({
        roomId: 'room-uuid-1',
        title: 'Problema 1',
        createdBy: 'tutor-uuid-1',
      });

      const saved = await repository.save(newProblem);

      expect(mockManager.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id FROM rooms WHERE id = $1 FOR UPDATE'),
        ['room-uuid-1'],
      );
      expect(mockManager.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('COALESCE(MAX(order_index), 0) + 1'),
        ['room-uuid-1'],
      );
      expect(mockManager.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO problems'),
        expect.arrayContaining(['room-uuid-1', 'Problema 1', 1]),
      );
      expect(saved.orderIndex).toBe(1);
    });

    it('uses explicit orderIndex if already provided on new problem', async () => {
      const mockManager = {
        query: jest.fn(),
      };

      (typeormRepo.manager.transaction as jest.Mock).mockImplementationOnce(
        async (cb: (manager: typeof mockManager) => Promise<Problem>) => cb(mockManager),
      );

      mockManager.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([fakeProblemRow({ orderIndex: 5 })]);

      const problem = Problem.create({
        roomId: 'room-uuid-1',
        title: 'Problema com Ordem Definida',
        orderIndex: 5,
        createdBy: 'tutor-uuid-1',
      });

      const saved = await repository.save(problem);

      expect(mockManager.query).toHaveBeenCalledTimes(2);
      expect(saved.orderIndex).toBe(5);
    });

    it('throws error when insert returns empty rows', async () => {
      const mockManager = {
        query: jest.fn(),
      };

      (typeormRepo.manager.transaction as jest.Mock).mockImplementationOnce(
        async (cb: (manager: typeof mockManager) => Promise<Problem>) => cb(mockManager),
      );

      mockManager.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ nextOrder: 1 }])
        .mockResolvedValueOnce([]);

      const problem = Problem.create({
        roomId: 'room-uuid-1',
        title: 'Problema',
        createdBy: 'tutor-uuid-1',
      });

      await expect(repository.save(problem)).rejects.toThrow(
        'Falha ao persistir problema no banco de dados.',
      );
    });

    it('updates an existing problem when id is present', async () => {
      typeormRepo.query.mockResolvedValueOnce([
        fakeProblemRow({ id: 'prob-uuid-1', title: 'Título Atualizado' }),
      ]);

      const problem = Problem.create({
        roomId: 'room-uuid-1',
        title: 'Título Atualizado',
        orderIndex: 1,
        createdBy: 'tutor-uuid-1',
      });
      problem.id = 'prob-uuid-1';

      const updated = await repository.save(problem);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE problems'),
        expect.arrayContaining(['Título Atualizado', 'prob-uuid-1']),
      );
      expect(updated.title).toBe('Título Atualizado');
    });

    it('throws error when update affects no rows', async () => {
      typeormRepo.query.mockResolvedValueOnce([]);

      const problem = Problem.create({
        roomId: 'room-uuid-1',
        title: 'Inexistente',
        orderIndex: 1,
        createdBy: 'tutor-uuid-1',
      });
      problem.id = 'non-existent';

      await expect(repository.save(problem)).rejects.toThrow(
        'Problema com ID non-existent não encontrado.',
      );
    });
  });
});
