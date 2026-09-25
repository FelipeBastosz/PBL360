/* eslint-disable @typescript-eslint/unbound-method */

import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UpdateRoomUseCase } from './update-room.use-case';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import { Room } from '../../domain/entities/room.entity';
import type { UpdateRoomDto } from '../dtos/update-room.dto';

describe('UpdateRoomUseCase', () => {
  let sut: UpdateRoomUseCase;
  let roomRepository: jest.Mocked<RoomRepository>;
  let mockRoom: Room;

  beforeEach(() => {
    roomRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCourseCode: jest.fn(),
      findByRoomCode: jest.fn(),
      findByTutorId: jest.fn(),
      update: jest.fn(),
      addTutor: jest.fn(),
      hasTutor: jest.fn(),
      removeTutor: jest.fn(),
    };

    sut = new UpdateRoomUseCase(roomRepository);

    mockRoom = new Room();
    mockRoom.id = 'room-123';
    mockRoom.tutorId = 'tutor-123';
    mockRoom.name = 'Sala de Arquitetura';
    mockRoom.courseCode = 'SALA-101';
    mockRoom.semester = '2023.2';
    mockRoom.active = true;

    jest.spyOn(mockRoom, 'isDeleted').mockReturnValue(false);

    roomRepository.findById.mockResolvedValue(mockRoom);
    roomRepository.hasTutor.mockResolvedValue(true);
    roomRepository.update.mockResolvedValue(mockRoom);
  });

  it('deve realizar uma edição válida com sucesso', async () => {
    const dto: UpdateRoomDto = {
      nome: 'Sala de Clean Architecture',
      semestre: '2024.1',
      ativo: true,
    };

    const response = await sut.execute(mockRoom.id, 'tutor-123', dto);

    expect(roomRepository.findById).toHaveBeenCalledWith(mockRoom.id);
    expect(roomRepository.hasTutor).toHaveBeenCalledWith(mockRoom.id, 'tutor-123');

    expect(roomRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sala de Clean Architecture',
        semester: '2024.1',
        active: true,
      }),
    );

    expect(response.message).toBe('Sala atualizada com sucesso');
    expect(response.data.name).toBe('Sala de Clean Architecture');
    expect(response.data.semester).toBe('2024.1');
  });

  it('não deve permitir a alteração do código da disciplina', async () => {
    const originalCode = mockRoom.courseCode;

    const dto = {
      nome: 'Novo Nome',
      courseCode: 'ABC123',
    } as unknown as UpdateRoomDto;

    await sut.execute(mockRoom.id, 'tutor-123', dto);

    expect(roomRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        courseCode: originalCode,
      }),
    );

    expect(roomRepository.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        courseCode: 'ABC123',
      }),
    );
  });

  it('deve bloquear a edição por um professor não vinculado à sala', async () => {
    roomRepository.hasTutor.mockResolvedValue(false);

    const dto: UpdateRoomDto = {
      nome: 'Tentativa de alteração da sala',
    };

    await expect(sut.execute(mockRoom.id, 'tutor-INTRUSO', dto)).rejects.toThrow(ForbiddenError);

    expect(roomRepository.hasTutor).toHaveBeenCalledWith(mockRoom.id, 'tutor-INTRUSO');
    expect(roomRepository.update).not.toHaveBeenCalled();
  });

  it('deve lançar erro quando a sala não existir', async () => {
    roomRepository.findById.mockResolvedValue(null);

    const dto: UpdateRoomDto = {
      nome: 'Nova sala',
    };

    await expect(sut.execute(mockRoom.id, 'tutor-123', dto)).rejects.toThrow(NotFoundError);

    expect(roomRepository.update).not.toHaveBeenCalled();
  });

  it('deve impedir a edição de uma sala excluída', async () => {
    jest.spyOn(mockRoom, 'isDeleted').mockReturnValue(true);

    const dto: UpdateRoomDto = {
      nome: 'Sala alterada',
    };

    await expect(sut.execute(mockRoom.id, 'tutor-123', dto)).rejects.toThrow(NotFoundError);

    expect(roomRepository.update).not.toHaveBeenCalled();
  });
});
