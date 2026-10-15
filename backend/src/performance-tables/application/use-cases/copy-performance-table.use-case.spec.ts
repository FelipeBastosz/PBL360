import {
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import { SYSTEM_PERFORMANCE_TABLES } from '../../domain/entities/system-performance-tables';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { CopyPerformanceTableUseCase } from './copy-performance-table.use-case';

describe('CopyPerformanceTableUseCase', () => {
  const findById = jest.fn();
  const create = jest.fn((table: PerformanceTable) => Promise.resolve(table));
  const assertTutorCanAccessRoom = jest.fn();
  const repository = { findById, create } as unknown as PerformanceTableRepository;
  const access = { assertTutorCanAccessRoom } as unknown as RoomAccessService;
  const useCase = new CopyPerformanceTableUseCase(repository, access);
  beforeEach(() => jest.clearAllMocks());

  it.each(SYSTEM_PERFORMANCE_TABLES)(
    'copies $name without changing its owner, criteria or weights',
    async (definition) => {
      const source = PerformanceTable.create({
        tutorId: 'seed',
        name: definition.name,
        criteria: [...definition.criteria],
      });
      Object.assign(source, { id: definition.id, tutorId: null, isDefault: true });
      source.criteria.forEach((criterion, i) => {
        criterion.id = `original-${i}`;
      });
      findById.mockResolvedValue(source);
      const before = source.criteria.map((criterion) => ({
        id: criterion.id,
        weight: criterion.weight,
      }));
      const copy = await useCase.execute({
        tableId: definition.id,
        tutorId: 'tutor',
        roomId: 'room',
      });
      expect(copy).toMatchObject({
        tutorId: 'tutor',
        roomId: 'room',
        isDefault: false,
        name: `${definition.name} — cópia`,
      });
      expect(copy.criteria.map((criterion) => criterion.id)).toEqual(
        definition.criteria.map(() => undefined),
      );
      expect(copy.criteria.map((criterion) => criterion.weight)).toEqual(
        definition.criteria.map((criterion) => criterion.weight),
      );
      copy.criteria[0]!.weight = 0;
      expect(
        source.criteria.map((criterion) => ({ id: criterion.id, weight: criterion.weight })),
      ).toEqual(before);
      expect(source.tutorId).toBeNull();
      expect(assertTutorCanAccessRoom).toHaveBeenCalledWith('room', 'tutor');
    },
  );
  it('rejects a missing table', async () => {
    findById.mockResolvedValue(null);
    await expect(useCase.execute({ tableId: 'missing', tutorId: 'tutor' })).rejects.toThrow(
      NotFoundError,
    );
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects a table that is not a system default', async () => {
    findById.mockResolvedValue({ isDefault: false });
    await expect(useCase.execute({ tableId: 'personal', tutorId: 'tutor' })).rejects.toThrow(
      UnprocessableEntityError,
    );
  });
  it('rejects a room the tutor cannot access', async () => {
    assertTutorCanAccessRoom.mockRejectedValueOnce(new ForbiddenError('Sem acesso.'));
    await expect(
      useCase.execute({ tableId: 'default', tutorId: 'tutor', roomId: 'room' }),
    ).rejects.toThrow(ForbiddenError);
    expect(create).not.toHaveBeenCalled();
  });
});
