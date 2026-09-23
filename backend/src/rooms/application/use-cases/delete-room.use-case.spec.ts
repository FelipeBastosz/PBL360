import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
      save: saveMock,
      findByCode: jest.fn(),
      findByAccessToken: jest.fn(),
      update: jest.fn(),
      addTutor: jest.fn(),
      hasTutor: jest.fn(),
      removeTutor: jest.fn(),
    };
    useCase = new DeleteRoomUseCase(roomRepositoryMock);

    room = Room.create({
      tutorId: 'tutor-123',
      name: 'Sala de Testes',
      code: 'EXA123',
      accessToken: 'token-secreto-123',
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

  it('deve lançar NotFoundException se a sala não existir', async () => {
    findByIdMock.mockResolvedValue(null);

    const dto: DeleteRoomDto = { tutorId: 'tutor-123' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(NotFoundException);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException se a sala já estiver excluída', async () => {
    room.delete();
    findByIdMock.mockResolvedValue(room);

    const dto: DeleteRoomDto = { tutorId: 'tutor-123' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(NotFoundException);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('deve lançar ForbiddenException se o professor não for o dono da sala', async () => {
    findByIdMock.mockResolvedValue(room);

    const dto: DeleteRoomDto = { tutorId: 'tutor-intruso' };

    await expect(useCase.execute('room-123', dto)).rejects.toThrow(ForbiddenException);
    expect(room.isDeleted()).toBe(false);
    expect(room.active).toBe(true);
    expect(saveMock).not.toHaveBeenCalled();
  });
});
