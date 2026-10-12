import { Room } from '../domain/entities/room.entity';
import type { RoomRepository } from '../domain/repositories/room.repository';

export const OWNER_ID = 'tutor-owner';
export const ROOM_ID = 'room-1';

export const buildRoom = (overrides: Partial<Room> = {}): Room => {
  const room = Room.create({
    tutorId: OWNER_ID,
    name: 'Engenharia de Software',
    courseCode: 'EXA123',
    roomCode: 'aB7kP2x9',
    semester: '2026.2',
  });

  return Object.assign(room, { id: ROOM_ID, createdAt: new Date('2026-01-01') }, overrides);
};

export const roomRepositoryStub = (): jest.Mocked<RoomRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByRoomCode: jest.fn(),
  joinStudent: jest.fn(),
  findByTutorId: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  addTutor: jest.fn(),
  hasTutor: jest.fn(),
  hasStudent: jest.fn(),
  listTutors: jest.fn(),
  removeTutor: jest.fn(),
  findForStudent: jest.fn(),
  findStudents: jest.fn(),
});

export const roomAccessStub = () => ({
  assertTutorCanAccessRoom: jest.fn(),
  assertTutorIsRoomOwner: jest.fn(),
  assertMemberCanAccessRoom: jest.fn(),
});
