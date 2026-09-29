import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  ROOM_ID,
  OWNER_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { ListRoomTutorsUseCase } from './list-room-tutors.use-case';

describe('ListRoomTutorsUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: ListRoomTutorsUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    access = roomAccessStub();
    access.assertTutorCanAccessRoom.mockResolvedValue(buildRoom());

    useCase = new ListRoomTutorsUseCase(rooms, access as unknown as RoomAccessService);
  });

  it('returns the tutors linked to the room', async () => {
    const tutors = [
      {
        id: OWNER_ID,
        name: 'Ana',
        email: 'ana@uefs.br',
        isResponsible: true,
      },
    ];
    rooms.listTutors.mockResolvedValue(tutors);

    const result = await useCase.execute(ROOM_ID, OWNER_ID);

    expect(result).toEqual(tutors);
    expect(access.assertTutorCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
    expect(rooms.listTutors).toHaveBeenCalledWith(ROOM_ID);
  });

  it('rejects a tutor without room access', async () => {
    access.assertTutorCanAccessRoom.mockRejectedValue(new ForbiddenError('Acesso negado'));

    await expect(useCase.execute(ROOM_ID, 'outside-tutor')).rejects.toBeInstanceOf(ForbiddenError);
    expect(rooms.listTutors).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the room does not exist', async () => {
    access.assertTutorCanAccessRoom.mockRejectedValue(new NotFoundError('Sala não encontrada.'));

    await expect(useCase.execute('missing-room', OWNER_ID)).rejects.toBeInstanceOf(NotFoundError);
    expect(rooms.listTutors).not.toHaveBeenCalled();
  });
});
