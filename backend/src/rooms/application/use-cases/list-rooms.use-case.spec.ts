import { buildRoom, OWNER_ID, roomRepositoryStub } from '../../testing/room-fixtures';
import { ListRoomsUseCase } from './list-rooms.use-case';

describe('ListRoomsUseCase', () => {
  it('returns the rooms linked to the tutor', async () => {
    const rooms = roomRepositoryStub();
    const room = buildRoom();
    const summaries = [{ room, totalStudents: 3, totalProblems: 2 }];
    rooms.findSummariesByTutorId.mockResolvedValue(summaries);

    await expect(new ListRoomsUseCase(rooms).execute(OWNER_ID)).resolves.toEqual(summaries);
    expect(rooms.findSummariesByTutorId).toHaveBeenCalledWith(OWNER_ID);
  });
});
