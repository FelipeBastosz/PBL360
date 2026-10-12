import { ForbiddenError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
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
      findTablesByRoom: jest.fn(),
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

  it('rejects creating a system default through the application', async () => {
    await expect(
      useCase.execute({
        tutorId: 'tutor',
        name: 'Padrão',
        isDefault: true,
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(createMock).not.toHaveBeenCalled();
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

  it('creates and persists a table linked to a room after verifying room access', async () => {
    const savedTable = { id: 'table-room-uuid', roomId: 'room-uuid-1' };
    createMock.mockResolvedValueOnce(savedTable);

    const assertTutorCanAccessRoom = jest.fn().mockResolvedValue({});
    const mockRoomAccess = {
      assertTutorCanAccessRoom,
    } as unknown as RoomAccessService;
    const repository = { create: createMock } as unknown as PerformanceTableRepository;
    const roomUseCase = new CreatePerformanceTableUseCase(repository, mockRoomAccess);

    const result = await roomUseCase.execute({
      tutorId: 'tutor-uuid-1',
      roomId: 'room-uuid-1',
      name: 'Barema da Sala',
      criteria: [{ name: 'Participação', orderIndex: 1, weight: 10 }],
    });

    expect(assertTutorCanAccessRoom).toHaveBeenCalledWith('room-uuid-1', 'tutor-uuid-1');
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorId: 'tutor-uuid-1',
        roomId: 'room-uuid-1',
        name: 'Barema da Sala',
      }),
    );
    expect(result).toBe(savedTable);
  });

  it('rejects creating table in a room when tutor lacks room access', async () => {
    const assertTutorCanAccessRoom = jest.fn().mockRejectedValue(new Error('Sem permissão'));
    const mockRoomAccess = {
      assertTutorCanAccessRoom,
    } as unknown as RoomAccessService;
    const repository = { create: createMock } as unknown as PerformanceTableRepository;
    const roomUseCase = new CreatePerformanceTableUseCase(repository, mockRoomAccess);

    await expect(
      roomUseCase.execute({
        tutorId: 'tutor-uuid-1',
        roomId: 'room-uuid-1',
        name: 'Barema da Sala',
        criteria: [{ name: 'Participação', weight: 10 }],
      }),
    ).rejects.toThrow('Sem permissão');

    expect(createMock).not.toHaveBeenCalled();
  });
});
