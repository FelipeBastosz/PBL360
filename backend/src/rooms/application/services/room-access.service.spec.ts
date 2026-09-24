import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { RoomAccessService } from './room-access.service';
import { ROOM_REPOSITORY } from '../../domain/repositories/room.repository';
import { Room } from '../../domain/entities/room.entity';

describe('RoomAccessService', () => {
  let service: RoomAccessService;
  let findByIdMock: jest.Mock;
  let hasTutorMock: jest.Mock;

  const createMockRoom = (tutorId = 'tutor-owner-id', deleted = false): Room => {
    const room = new Room();
    room.id = 'room-uuid-1';
    room.tutorId = tutorId;
    room.name = 'PBL 1';
    room.courseCode = 'EXA101';
    room.roomCode = 'tok12345';
    room.semester = '2026.1';
    room.active = !deleted;
    room.createdAt = new Date();
    room.deletedAt = deleted ? new Date() : undefined;
    return room;
  };

  beforeEach(async () => {
    findByIdMock = jest.fn();
    hasTutorMock = jest.fn();

    const mockRoomRepository = {
      findById: findByIdMock,
      hasTutor: hasTutorMock,
      save: jest.fn(),
      findByAccessToken: jest.fn(),
      findByTutorId: jest.fn(),
      update: jest.fn(),
      addTutor: jest.fn(),
      removeTutor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomAccessService,
        {
          provide: ROOM_REPOSITORY,
          useValue: mockRoomRepository,
        },
      ],
    }).compile();

    service = module.get<RoomAccessService>(RoomAccessService);
  });

  describe('assertTutorCanAccessRoom', () => {
    it('returns the room when the tutor is the owner', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);

      const result = await service.assertTutorCanAccessRoom('room-uuid-1', 'tutor-owner-id');

      expect(result).toBe(mockRoom);
      expect(findByIdMock).toHaveBeenCalledWith('room-uuid-1');
      expect(hasTutorMock).not.toHaveBeenCalled();
    });

    it('returns the room when the tutor is an associated co-tutor', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);
      hasTutorMock.mockResolvedValue(true);

      const result = await service.assertTutorCanAccessRoom('room-uuid-1', 'tutor-co-id');

      expect(result).toBe(mockRoom);
      expect(findByIdMock).toHaveBeenCalledWith('room-uuid-1');
      expect(hasTutorMock).toHaveBeenCalledWith('room-uuid-1', 'tutor-co-id');
    });

    it('throws NotFoundException when room does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.assertTutorCanAccessRoom('non-existent-id', 'tutor-id')).rejects.toThrow(
        new NotFoundException('Sala não encontrada.'),
      );
    });

    it('throws NotFoundException when room is deleted', async () => {
      const deletedRoom = createMockRoom('tutor-owner-id', true);
      findByIdMock.mockResolvedValue(deletedRoom);

      await expect(
        service.assertTutorCanAccessRoom('room-uuid-1', 'tutor-owner-id'),
      ).rejects.toThrow(new NotFoundException('Sala não encontrada.'));
    });

    it('throws ForbiddenException when tutor is neither owner nor associated', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);
      hasTutorMock.mockResolvedValue(false);

      await expect(
        service.assertTutorCanAccessRoom('room-uuid-1', 'unauthorized-tutor-id'),
      ).rejects.toThrow(
        new ForbiddenException('Você não tem permissão para acessar ou modificar esta sala.'),
      );
    });
  });

  describe('assertTutorIsRoomOwner', () => {
    it('returns the room when tutor is the responsible owner', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);

      const result = await service.assertTutorIsRoomOwner('room-uuid-1', 'tutor-owner-id');

      expect(result).toBe(mockRoom);
    });

    it('throws NotFoundException when room does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.assertTutorIsRoomOwner('non-existent-id', 'tutor-id')).rejects.toThrow(
        new NotFoundException('Sala não encontrada.'),
      );
    });

    it('throws NotFoundException when room is deleted', async () => {
      const deletedRoom = createMockRoom('tutor-owner-id', true);
      findByIdMock.mockResolvedValue(deletedRoom);

      await expect(service.assertTutorIsRoomOwner('room-uuid-1', 'tutor-owner-id')).rejects.toThrow(
        new NotFoundException('Sala não encontrada.'),
      );
    });

    it('throws ForbiddenException when tutor is not the owner', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);

      await expect(service.assertTutorIsRoomOwner('room-uuid-1', 'other-tutor-id')).rejects.toThrow(
        new ForbiddenException('Apenas o professor responsável pode realizar esta ação.'),
      );
    });
  });

  describe('assertResourceBelongsToRoom', () => {
    it('does not throw when resource belongs to the expected room', () => {
      expect(() =>
        service.assertResourceBelongsToRoom('room-uuid-1', 'room-uuid-1', 'Problema'),
      ).not.toThrow();
    });

    it('throws NotFoundException when resource belongs to a different room', () => {
      expect(() =>
        service.assertResourceBelongsToRoom('room-uuid-2', 'room-uuid-1', 'Problema'),
      ).toThrow(new NotFoundException('Problema não encontrado nesta sala.'));
    });
  });
});
