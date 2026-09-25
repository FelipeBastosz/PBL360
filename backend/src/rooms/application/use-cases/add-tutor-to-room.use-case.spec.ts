import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository';
import type { RoomAccessService } from '../services/room-access.service';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { AddTutorToRoomUseCase } from './add-tutor-to-room.use-case';

const NEW_TUTOR_ID = 'tutor-2';

const userOfType = (type: UserType): User => Object.assign(new User(), { id: NEW_TUTOR_ID, type });

describe('AddTutorToRoomUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let users: jest.Mocked<UserRepository>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: AddTutorToRoomUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    users = { findByEmail: jest.fn(), findById: jest.fn(), save: jest.fn() };
    access = roomAccessStub();
    access.assertTutorIsRoomOwner.mockResolvedValue(buildRoom());
    useCase = new AddTutorToRoomUseCase(rooms, users, access as unknown as RoomAccessService);
  });

  it('links the tutor to the room', async () => {
    users.findById.mockResolvedValue(userOfType(UserType.TUTOR));
    rooms.addTutor.mockResolvedValue(true);

    await useCase.execute(ROOM_ID, OWNER_ID, NEW_TUTOR_ID);

    expect(access.assertTutorIsRoomOwner).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
    expect(rooms.addTutor).toHaveBeenCalledWith(ROOM_ID, NEW_TUTOR_ID);
  });

  it('only lets the owner add tutors', async () => {
    access.assertTutorIsRoomOwner.mockRejectedValue(new ForbiddenError('negado'));

    await expect(useCase.execute(ROOM_ID, 'other', NEW_TUTOR_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(rooms.addTutor).not.toHaveBeenCalled();
  });

  it.each([null, userOfType(UserType.STUDENT)])(
    'rejects a user that is not a tutor',
    async (user) => {
      users.findById.mockResolvedValue(user);

      await expect(useCase.execute(ROOM_ID, OWNER_ID, NEW_TUTOR_ID)).rejects.toThrow(
        new NotFoundError('Professor não encontrado.'),
      );
    },
  );

  it('reports a tutor that is already linked', async () => {
    users.findById.mockResolvedValue(userOfType(UserType.TUTOR));
    rooms.addTutor.mockResolvedValue(false);

    await expect(useCase.execute(ROOM_ID, OWNER_ID, NEW_TUTOR_ID)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});
