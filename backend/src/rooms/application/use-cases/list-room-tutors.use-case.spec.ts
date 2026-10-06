import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  ROOM_ID,
  OWNER_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ListRoomTutorsUseCase } from './list-room-tutors.use-case';

const tutor = { id: OWNER_ID, type: UserType.TUTOR };
const student = { id: 'student-id', type: UserType.STUDENT };

describe('ListRoomTutorsUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: ListRoomTutorsUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    access = roomAccessStub();
    access.assertMemberCanAccessRoom.mockResolvedValue(buildRoom());

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

    const result = await useCase.execute({ roomId: ROOM_ID, member: tutor });

    expect(result).toEqual(tutors);
    expect(access.assertMemberCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, tutor);
    expect(rooms.listTutors).toHaveBeenCalledWith(ROOM_ID);
  });

  it('lets an enrolled student see the room tutors', async () => {
    rooms.listTutors.mockResolvedValue([]);

    await expect(useCase.execute({ roomId: ROOM_ID, member: student })).resolves.toEqual([]);
    expect(access.assertMemberCanAccessRoom).toHaveBeenCalledWith(ROOM_ID, student);
  });

  it('rejects a member without room access', async () => {
    access.assertMemberCanAccessRoom.mockRejectedValue(new ForbiddenError('Acesso negado'));

    await expect(useCase.execute({ roomId: ROOM_ID, member: student })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(rooms.listTutors).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the room does not exist', async () => {
    access.assertMemberCanAccessRoom.mockRejectedValue(new NotFoundError('Sala não encontrada.'));

    await expect(useCase.execute({ roomId: 'missing-room', member: tutor })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(rooms.listTutors).not.toHaveBeenCalled();
  });
});
