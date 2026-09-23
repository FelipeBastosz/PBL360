/* eslint-disable @typescript-eslint/unbound-method */
import { UpdateRoomUseCase } from './update-room.use-case';
import type { RoomRepository } from '../../domain/repositories/room.repository';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import { Room } from '../../domain/entities/room.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { UpdateRoomDto } from '../dtos/update-room.dto';
import type { User } from '@/users/domain/entities/user.entity';

describe('UpdateRoomUseCase', () => {
  let sut: UpdateRoomUseCase;
  let roomRepository: jest.Mocked<RoomRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let mockRoom: Room;

  beforeEach(() => {
    roomRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByAccessToken: jest.fn(),
      update: jest.fn(),
    };

    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    sut = new UpdateRoomUseCase(roomRepository, userRepository);

    mockRoom = new Room();
    mockRoom.id = 'room-123';
    mockRoom.tutorId = 'tutor-123';
    mockRoom.name = 'Sala de Arquitetura';
    mockRoom.code = 'SALA-101';
    mockRoom.semester = '2023.2';
    mockRoom.active = true;

    jest.spyOn(mockRoom, 'isDeleted').mockReturnValue(false);
  });

  it('deve realizar uma edição válida com sucesso', async () => {
    userRepository.findById.mockResolvedValue({ id: 'tutor-123' } as User);
    roomRepository.findById.mockResolvedValue(mockRoom);

    const dto: UpdateRoomDto = {
      tutorId: 'tutor-123',
      nome: 'Sala de Clean Architecture',
      semestre: '2024.1',
      ativo: true,
    };

    const response = await sut.execute(mockRoom.id, dto);

    expect(userRepository.findById).toHaveBeenCalledWith('tutor-123');
    expect(roomRepository.findById).toHaveBeenCalledWith(mockRoom.id);
    expect(roomRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sala de Clean Architecture',
        semester: '2024.1',
        active: true,
      }),
    );
    expect(response.message).toBe('Sala atualizada com sucesso');
    expect(response.data.name).toBe('Sala de Clean Architecture');
  });

  it('não deve permitir a alteração do código da sala (ignorando o envio no DTO)', async () => {
    userRepository.findById.mockResolvedValue({ id: 'tutor-123' } as User);
    roomRepository.findById.mockResolvedValue(mockRoom);

    const dto = {
      tutorId: 'tutor-123',
      nome: 'Novo Nome',
      code: 'SALA-HACKEADA',
    } as unknown as UpdateRoomDto;

    await sut.execute(mockRoom.id, dto);

    expect(roomRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: mockRoom.code,
      }),
    );

    expect(roomRepository.save).not.toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SALA-HACKEADA',
      }),
    );
  });

  it('deve bloquear a edição por um professor (tutor) não vinculado à sala', async () => {
    userRepository.findById.mockResolvedValue({ id: 'tutor-INTRUSO' } as User);
    roomRepository.findById.mockResolvedValue(mockRoom);

    const dto: UpdateRoomDto = {
      tutorId: 'tutor-INTRUSO',
      nome: 'Tentativa de roubo de sala',
    };

    await expect(sut.execute(mockRoom.id, dto)).rejects.toThrow(ForbiddenException);
    expect(roomRepository.save).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o tutorId passado não existir no sistema', async () => {
    userRepository.findById.mockResolvedValue(null);

    const dto: UpdateRoomDto = { tutorId: 'tutor-fantasma' };

    await expect(sut.execute(mockRoom.id, dto)).rejects.toThrow(NotFoundException);
    expect(roomRepository.save).not.toHaveBeenCalled();
  });
});
