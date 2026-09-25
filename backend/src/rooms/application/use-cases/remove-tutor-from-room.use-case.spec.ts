import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { RemoveTutorFromRoomUseCase } from './remove-tutor-from-room.use-case';

describe('RemoveTutorFromRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: RemoveTutorFromRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    access = roomAccessStub();
    access.assertTutorIsRoomOwner.mockResolvedValue(buildRoom());
    useCase = new RemoveTutorFromRoomUseCase(rooms, access as unknown as RoomAccessService);
  });

  it('unlinks the tutor from the room', async () => {
    rooms.removeTutor.mockResolvedValue(true);

    await useCase.execute(ROOM_ID, OWNER_ID, 'tutor-2');

    expect(rooms.removeTutor).toHaveBeenCalledWith(ROOM_ID, 'tutor-2');
  });

  it('never removes the owner', async () => {
    await expect(useCase.execute(ROOM_ID, OWNER_ID, OWNER_ID)).rejects.toThrow(
      new ForbiddenError('O professor responsável não pode ser removido da sala.'),
    );
    expect(rooms.removeTutor).not.toHaveBeenCalled();
  });

  it('reports a tutor that is not linked', async () => {
    rooms.removeTutor.mockResolvedValue(false);

    await expect(useCase.execute(ROOM_ID, OWNER_ID, 'tutor-2')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('only lets the owner remove tutors', async () => {
    access.assertTutorIsRoomOwner.mockRejectedValue(new ForbiddenError('negado'));

    await expect(useCase.execute(ROOM_ID, 'other', 'tutor-2')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
