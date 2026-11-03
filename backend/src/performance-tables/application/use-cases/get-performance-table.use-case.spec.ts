import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';
import { GetPerformanceTableUseCase } from './get-performance-table.use-case';

describe('GetPerformanceTableUseCase', () => {
  let useCase: GetPerformanceTableUseCase;
  let findByIdMock: jest.Mock;
  let repository: jest.Mocked<PerformanceTableRepository>;
  let assertTutorCanAccessRoomMock: jest.Mock;
  let roomAccessServiceMock: jest.Mocked<RoomAccessService>;

  beforeEach(() => {
    findByIdMock = jest.fn();

    repository = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findTablesByRoom: jest.fn(),
      findById: findByIdMock,
      softDelete: jest.fn(),
      update: jest.fn(),
      findUsageById: jest.fn().mockResolvedValue({
        problemCount: 1,
        sessionCount: 3,
        pastSessionCount: 1,
      }),
      findByIdIncludingDeleted: jest.fn(),
    };

    assertTutorCanAccessRoomMock = jest.fn().mockResolvedValue(undefined);
    roomAccessServiceMock = {
      assertTutorCanAccessRoom: assertTutorCanAccessRoomMock,
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new GetPerformanceTableUseCase(repository, roomAccessServiceMock);
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
    expect(result.sessionCount).toBe(3);
    expect(result.pastSessionCount).toBe(1);
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

  it('throws ForbiddenError when user is not the table owner and table has no room', async () => {
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

  it('allows access to default table even if user is not the owner', async () => {
    const table = new PerformanceTable();
    table.id = 'table-default';
    table.tutorId = 'other-tutor';
    table.isDefault = true;
    table.name = 'Fórmula Padrão';
    table.criteria = [];

    findByIdMock.mockResolvedValueOnce(table);

    const result = await useCase.execute({
      tableId: 'table-default',
      tutorId: 'tutor-uuid-1',
    });

    expect(result).toBe(table);
    expect(result.sessionCount).toBe(3);
    expect(result.pastSessionCount).toBe(1);
  });

  it('allows a co-tutor to access a table linked to their room and loads usage metrics', async () => {
    const table = new PerformanceTable();
    table.id = 'table-room-1';
    table.tutorId = 'owner-tutor';
    table.roomId = 'room-101';
    table.name = 'Barema da Turma';
    table.criteria = [];

    findByIdMock.mockResolvedValueOnce(table);

    const result = await useCase.execute({
      tableId: 'table-room-1',
      tutorId: 'co-tutor-99',
    });

    expect(assertTutorCanAccessRoomMock).toHaveBeenCalledWith('room-101', 'co-tutor-99');
    expect(result).toBe(table);
    expect(result.sessionCount).toBe(3);
    expect(result.pastSessionCount).toBe(1);
  });

  it('rejects access when co-tutor does not have access to the room', async () => {
    const table = new PerformanceTable();
    table.id = 'table-room-1';
    table.tutorId = 'owner-tutor';
    table.roomId = 'room-101';
    table.name = 'Barema da Turma';

    findByIdMock.mockResolvedValueOnce(table);
    assertTutorCanAccessRoomMock.mockRejectedValueOnce(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(
      useCase.execute({
        tableId: 'table-room-1',
        tutorId: 'unauthorized-tutor',
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(assertTutorCanAccessRoomMock).toHaveBeenCalledWith('room-101', 'unauthorized-tutor');
  });
});
