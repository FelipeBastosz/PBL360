import { buildRoom, OWNER_ID, roomRepositoryStub } from '../../testing/room-fixtures';
import { ListRoomsUseCase } from './list-rooms.use-case';

describe('ListRoomsUseCase', () => {
  it('returns the rooms linked to the tutor', async () => {
    const rooms = roomRepositoryStub();
    const room = buildRoom();
    rooms.findByTutorId.mockResolvedValue([room]);

    await expect(new ListRoomsUseCase(rooms).execute(OWNER_ID)).resolves.toEqual([room]);
    expect(rooms.findByTutorId).toHaveBeenCalledWith(OWNER_ID);
  });
});
