import { ForbiddenError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { DeleteRoomUseCase } from './delete-room.use-case';

describe('DeleteRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: DeleteRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    access = roomAccessStub();
    useCase = new DeleteRoomUseCase(rooms, access as unknown as RoomAccessService);
  });

  it('soft deletes the room when the owner asks', async () => {
    const room = buildRoom();
    access.assertTutorIsRoomOwner.mockResolvedValue(room);

    await useCase.execute(ROOM_ID, OWNER_ID);

    expect(access.assertTutorIsRoomOwner).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
    expect(rooms.softDelete).toHaveBeenCalledWith(room);
    expect(room.isDeleted()).toBe(true);
    expect(room.active).toBe(false);
  });

  it('does not delete when the tutor is not the owner', async () => {
    access.assertTutorIsRoomOwner.mockRejectedValue(new ForbiddenError('negado'));

    await expect(useCase.execute(ROOM_ID, 'other')).rejects.toBeInstanceOf(ForbiddenError);
    expect(rooms.softDelete).not.toHaveBeenCalled();
  });
});
