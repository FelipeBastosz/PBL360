import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import type { DeleteRoomDto } from '../dtos/delete-room.dto';
import { Room } from '../../domain/entities/room.entity';
import { DeleteRoomUseCase } from './delete-room.use-case';

describe('DeleteRoomUseCase', () => {
  let useCase: DeleteRoomUseCase;
  let roomRepositoryMock: jest.Mocked<RoomRepository>;
  let room: Room;
  let findByIdMock: jest.Mock;
  let saveMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();
    saveMock = jest.fn();

    roomRepositoryMock = {
      findById: findByIdMock,
      findByTutorId: jest.fn(),
      save: saveMock,
      findByCourseCode: jest.fn(),
      findByRoomCode: jest.fn(),
      update: jest.fn(),
      addTutor: jest.fn(),
      hasTutor: jest.fn(),
      removeTutor: jest.fn(),
    };
    useCase = new DeleteRoomUseCase(roomRepositoryMock);

    room = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala de Testes',
      courseCode: 'EXA123',
      roomCode: 'token-secreto-123',
      semester: '2026.2',
    });

    room.id = 'room-123';
  });

  it('deve excluir a sala com sucesso e salvar as alterações', async () => {
    findByIdMock.mockResolvedValue(room);

    const dto: DeleteRoomDto = { tutorId: 'tutor-123' };

    await useCase.execute('room-123', dto);

    expect(findByIdMock).toHaveBeenCalledWith('room-123');
    expect(room.isDeleted()).toBe(true);
    expect(room.active).toBe(false);
    expect(room.deletedAt).toBeInstanceOf(Date);
    expect(saveMock).toHaveBeenCalledWith(room);
  });

  it('deve lançar NotFoundError se a sala não existir', async () => {
    findByIdMock.mockResolvedValue(null);

    const dto: DeleteRoomDto = { tutorId: 'tutor-123' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(NotFoundError);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundError se a sala já estiver excluída', async () => {
    room.delete();
    findByIdMock.mockResolvedValue(room);

    const dto: DeleteRoomDto = { tutorId: 'tutor-123' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(NotFoundError);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('deve lançar ForbiddenError se o professor não for o dono da sala', async () => {
    findByIdMock.mockResolvedValue(room);

    const dto: DeleteRoomDto = { tutorId: 'tutor-intruso' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(ForbiddenError);
    expect(room.isDeleted()).toBe(false);
    expect(room.active).toBe(true);
    expect(saveMock).not.toHaveBeenCalled();
  });
});
