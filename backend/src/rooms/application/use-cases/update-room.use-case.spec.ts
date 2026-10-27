import { ForbiddenError } from '@/shared/errors/application.error';
import type { Room } from '../../domain/entities/room.entity';
import { InvalidRoomError } from '../../domain/errors/invalid-room.error';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { UpdateRoomUseCase } from './update-room.use-case';

describe('UpdateRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: UpdateRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    rooms.update.mockImplementation((room: Room) => Promise.resolve(room));
    access = roomAccessStub();
    access.assertTutorCanAccessRoom.mockResolvedValue(buildRoom());
    useCase = new UpdateRoomUseCase(rooms, access as unknown as RoomAccessService);
  });

  it('applies only the informed changes', async () => {
    const room = await useCase.execute({
      roomId: ROOM_ID,
      tutorId: OWNER_ID,
      changes: { name: ' Nova Sala ', active: false },
    });

    expect(access.assertTutorCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
    expect(room).toMatchObject({ name: 'Nova Sala', semester: '2026.2', active: false });
  });

  it('rejects changes that break the room rules', async () => {
    await expect(
      useCase.execute({ roomId: ROOM_ID, tutorId: OWNER_ID, changes: { semester: '   ' } }),
    ).rejects.toBeInstanceOf(InvalidRoomError);
    expect(rooms.update).not.toHaveBeenCalled();
  });

  it('does not update a room the tutor cannot access', async () => {
    access.assertTutorCanAccessRoom.mockRejectedValue(new ForbiddenError('negado'));

    await expect(
      useCase.execute({ roomId: ROOM_ID, tutorId: 'other', changes: { name: 'x' } }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(rooms.update).not.toHaveBeenCalled();
  });
});
