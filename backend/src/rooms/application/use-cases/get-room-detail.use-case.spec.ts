/* eslint-disable @typescript-eslint/unbound-method */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { type Room } from '../../domain/entities/room.entity';
import { type RoomRepository } from '../../domain/repositories/room.repository';
import { GetRoomDetailUseCase } from './get-room-detail.use-case';

describe('GetRoomDetailUseCase', () => {
  let useCase: GetRoomDetailUseCase;
  let roomRepository: jest.Mocked<RoomRepository>;

  const roomId = '550e8400-e29b-41d4-a716-446655440000';
  const creatorId = '123e4567-e89b-42d3-a456-426614174000';
  const associatedTutorId = '987e6543-e21b-42d3-a456-426614174000';

  const makeRoom = (deleted = false): Room =>
    ({
      id: roomId,
      tutorId: creatorId,
      name: 'Engenharia de Software',
      courseCode: 'EXA123',
      roomCode: 'aB7kP2x9',
      semester: '2026.2',
      active: true,
      createdAt: new Date('2026-09-24T12:00:00.000Z'),
      isDeleted: jest.fn().mockReturnValue(deleted),
    }) as unknown as Room;

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

    useCase = new GetRoomDetailUseCase(roomRepository);
  });

  it('deve retornar os dados completos da sala para o professor criador', async () => {
    const room = makeRoom();
    roomRepository.findById.mockResolvedValue(room);
    roomRepository.hasTutor.mockResolvedValue(true);

    const result = await useCase.execute(roomId, creatorId);

    expect(roomRepository.findById).toHaveBeenCalledWith(roomId);
    expect(roomRepository.hasTutor).toHaveBeenCalledWith(roomId, creatorId);
    expect(result).toEqual({
      id: roomId,
      tutorId: creatorId,
      name: 'Engenharia de Software',
      courseCode: 'EXA123',
      roomCode: 'aB7kP2x9',
      semester: '2026.2',
      active: true,
      createdAt: room.createdAt,
    });
  });

  it('deve permitir a consulta por outro professor vinculado à sala', async () => {
    roomRepository.findById.mockResolvedValue(makeRoom());
    roomRepository.hasTutor.mockResolvedValue(true);

    const result = await useCase.execute(roomId, associatedTutorId);

    expect(result.id).toBe(roomId);
    expect(result.roomCode).toBe('aB7kP2x9');
    expect(roomRepository.hasTutor).toHaveBeenCalledWith(roomId, associatedTutorId);
  });

  it('deve lançar NotFoundException quando a sala não existir', async () => {
    roomRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(roomId, creatorId)).rejects.toThrow(NotFoundException);

    expect(roomRepository.hasTutor).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando a sala estiver excluída', async () => {
    roomRepository.findById.mockResolvedValue(makeRoom(true));

    await expect(useCase.execute(roomId, creatorId)).rejects.toThrow(NotFoundException);

    expect(roomRepository.hasTutor).not.toHaveBeenCalled();
  });

  it('deve lançar ForbiddenException quando o professor não estiver vinculado', async () => {
    roomRepository.findById.mockResolvedValue(makeRoom());
    roomRepository.hasTutor.mockResolvedValue(false);

    await expect(useCase.execute(roomId, associatedTutorId)).rejects.toThrow(ForbiddenException);

    expect(roomRepository.hasTutor).toHaveBeenCalledWith(roomId, associatedTutorId);
  });
});
