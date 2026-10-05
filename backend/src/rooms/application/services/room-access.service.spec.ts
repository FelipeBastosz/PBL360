import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { Test, type TestingModule } from '@nestjs/testing';
import { RoomAccessService } from './room-access.service';
import { ROOM_REPOSITORY } from '../../domain/repositories/room.repository';
import { Room } from '../../domain/entities/room.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';

describe('RoomAccessService', () => {
  let service: RoomAccessService;
  let findByIdMock: jest.Mock;
  let hasTutorMock: jest.Mock;
  let hasStudentMock: jest.Mock;

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
    hasStudentMock = jest.fn();

    const mockRoomRepository = {
      findById: findByIdMock,
      hasTutor: hasTutorMock,
      hasStudent: hasStudentMock,
      create: jest.fn(),
      findByTutorId: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
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

    it('throws NotFoundError when room does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.assertTutorCanAccessRoom('non-existent-id', 'tutor-id')).rejects.toThrow(
        new NotFoundError('Sala não encontrada.'),
      );
    });

    it('throws NotFoundError when room is deleted', async () => {
      const deletedRoom = createMockRoom('tutor-owner-id', true);
      findByIdMock.mockResolvedValue(deletedRoom);

      await expect(
        service.assertTutorCanAccessRoom('room-uuid-1', 'tutor-owner-id'),
      ).rejects.toThrow(new NotFoundError('Sala não encontrada.'));
    });

    it('throws ForbiddenError when tutor is neither owner nor associated', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);
      hasTutorMock.mockResolvedValue(false);

      await expect(
        service.assertTutorCanAccessRoom('room-uuid-1', 'unauthorized-tutor-id'),
      ).rejects.toThrow(
        new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
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

    it('throws NotFoundError when room does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.assertTutorIsRoomOwner('non-existent-id', 'tutor-id')).rejects.toThrow(
        new NotFoundError('Sala não encontrada.'),
      );
    });

    it('throws NotFoundError when room is deleted', async () => {
      const deletedRoom = createMockRoom('tutor-owner-id', true);
      findByIdMock.mockResolvedValue(deletedRoom);

      await expect(service.assertTutorIsRoomOwner('room-uuid-1', 'tutor-owner-id')).rejects.toThrow(
        new NotFoundError('Sala não encontrada.'),
      );
    });

    it('throws ForbiddenError when tutor is not the owner', async () => {
      const mockRoom = createMockRoom('tutor-owner-id');
      findByIdMock.mockResolvedValue(mockRoom);

      await expect(service.assertTutorIsRoomOwner('room-uuid-1', 'other-tutor-id')).rejects.toThrow(
        new ForbiddenError('Apenas o professor responsável pode realizar esta ação.'),
      );
    });
  });

  describe('assertMemberCanAccessRoom', () => {
    it('applies the tutor rule to a tutor', async () => {
      findByIdMock.mockResolvedValue(createMockRoom('tutor-owner-id'));

      await expect(
        service.assertMemberCanAccessRoom('room-uuid-1', {
          id: 'tutor-owner-id',
          type: UserType.TUTOR,
        }),
      ).resolves.toBeInstanceOf(Room);
      expect(hasStudentMock).not.toHaveBeenCalled();
    });

    it('lets an enrolled student in', async () => {
      findByIdMock.mockResolvedValue(createMockRoom());
      hasStudentMock.mockResolvedValue(true);

      await expect(
        service.assertMemberCanAccessRoom('room-uuid-1', {
          id: 'student-1',
          type: UserType.STUDENT,
        }),
      ).resolves.toBeInstanceOf(Room);
      expect(hasStudentMock).toHaveBeenCalledWith('room-uuid-1', 'student-1');
    });

    it('denies a student who is not enrolled', async () => {
      findByIdMock.mockResolvedValue(createMockRoom());
      hasStudentMock.mockResolvedValue(false);

      await expect(
        service.assertMemberCanAccessRoom('room-uuid-1', {
          id: 'student-2',
          type: UserType.STUDENT,
        }),
      ).rejects.toThrow(new ForbiddenError('Você não participa desta sala.'));
    });

    it('answers not found for a deleted room', async () => {
      findByIdMock.mockResolvedValue(createMockRoom('tutor-owner-id', true));

      await expect(
        service.assertMemberCanAccessRoom('room-uuid-1', {
          id: 'student-1',
          type: UserType.STUDENT,
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
