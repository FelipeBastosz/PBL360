import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import { buildRoom, OWNER_ID, ROOM_ID, roomAccessStub } from '../../testing/room-fixtures';
import { GetRoomDetailUseCase } from './get-room-detail.use-case';

describe('GetRoomDetailUseCase', () => {
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: GetRoomDetailUseCase;

  beforeEach(() => {
    access = roomAccessStub();
    useCase = new GetRoomDetailUseCase(access as unknown as RoomAccessService);
  });

  it('returns the room to any tutor linked to it', async () => {
    const room = buildRoom();
    access.assertTutorCanAccessRoom.mockResolvedValue(room);

    await expect(useCase.execute({ roomId: ROOM_ID, tutorId: OWNER_ID })).resolves.toBe(room);
    expect(access.assertTutorCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
  });

  it.each([new NotFoundError('Sala não encontrada.'), new ForbiddenError('negado')])(
    'propagates the access decision %p',
    async (error) => {
      access.assertTutorCanAccessRoom.mockRejectedValue(error);

      await expect(useCase.execute({ roomId: ROOM_ID, tutorId: 'other' })).rejects.toBe(error);
    },
  );
});
