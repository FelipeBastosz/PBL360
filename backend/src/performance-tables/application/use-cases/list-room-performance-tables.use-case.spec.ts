import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { Room } from '@/rooms/domain/entities/room.entity';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PerformanceTableOrigin,
  type PerformanceTableRepository,
  type RoomPerformanceTableItem,
} from '../../domain/repositories/performance-table.repository';
import { ListRoomPerformanceTablesUseCase } from './list-room-performance-tables.use-case';

describe('ListRoomPerformanceTablesUseCase', () => {
  const roomId = 'room-uuid-1';
  const tutorId = 'tutor-uuid-1';
  const coTutorId = 'co-tutor-uuid-2';

  let repository: jest.Mocked<PerformanceTableRepository>;
  let roomAccessService: jest.Mocked<RoomAccessService>;
  let useCase: ListRoomPerformanceTablesUseCase;

  const mockRoomTables: RoomPerformanceTableItem[] = [
    {
      id: 'table-room-1',
      nome: 'Barema da Turma',
      descricao: 'Criada pelo tutor titular',
      origem: PerformanceTableOrigin.TURMA,
      autor: { id: tutorId, nome: 'Professor Titular' },
      criterios: [
        { id: 'c1', nome: 'Domínio', descricao: null, ordem: 1, peso: 10, notaMaxima: 10 },
      ],
      emUso: 3,
    },
    {
      id: 'table-personal-1',
      nome: 'Meu Barema Pessoal',
      descricao: 'Criada fora de turmas',
      origem: PerformanceTableOrigin.PESSOAL,
      autor: { id: coTutorId, nome: 'Professor Co-tutor' },
      criterios: [
        { id: 'c2', nome: 'Postura', descricao: null, ordem: 1, peso: 10, notaMaxima: 10 },
      ],
      emUso: 0,
    },
    {
      id: 'table-default-1',
      nome: 'Barema Padrão',
      descricao: 'Padrão do sistema',
      origem: PerformanceTableOrigin.PADRAO,
      autor: { id: 'admin-uuid', nome: 'Administrador' },
      criterios: [{ id: 'c3', nome: 'Geral', descricao: null, ordem: 1, peso: 10, notaMaxima: 10 }],
      emUso: 1,
    },
  ];

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findSummariesByTutorId: jest.fn(),
      findTablesByRoom: jest.fn().mockResolvedValue(mockRoomTables),
      findById: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
      findUsageById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
    };

    roomAccessService = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(new Room()),
      assertMemberCanAccessRoom: jest.fn(),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new ListRoomPerformanceTablesUseCase(repository, roomAccessService);
  });

  it('allows newly added co-tutor to see existing room tables, personal tables, and default tables', async () => {
    const result = await useCase.execute({ roomId, tutorId: coTutorId });

    expect(roomAccessService.assertTutorCanAccessRoom).toHaveBeenCalledWith(roomId, coTutorId);
    expect(repository.findTablesByRoom).toHaveBeenCalledWith(roomId, coTutorId);
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockRoomTables);

    const roomTable = result.find((t) => t.origem === PerformanceTableOrigin.TURMA);
    expect(roomTable).toBeDefined();
    expect(roomTable?.autor.nome).toBe('Professor Titular');
    expect(roomTable?.emUso).toBe(3);

    const personalTable = result.find((t) => t.origem === PerformanceTableOrigin.PESSOAL);
    expect(personalTable).toBeDefined();
    expect(personalTable?.autor.id).toBe(coTutorId);

    const defaultTable = result.find((t) => t.origem === PerformanceTableOrigin.PADRAO);
    expect(defaultTable).toBeDefined();
  });

  it('rejects access when tutor is not member of the room (e.g. removed or from another room)', async () => {
    roomAccessService.assertTutorCanAccessRoom.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute({ roomId, tutorId: 'unauthorized-tutor' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repository.findTablesByRoom).not.toHaveBeenCalled();
  });

  it('rejects access when room is not found', async () => {
    roomAccessService.assertTutorCanAccessRoom.mockRejectedValue(
      new NotFoundError('Sala não encontrada.'),
    );

    await expect(useCase.execute({ roomId, tutorId })).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.findTablesByRoom).not.toHaveBeenCalled();
  });
});
