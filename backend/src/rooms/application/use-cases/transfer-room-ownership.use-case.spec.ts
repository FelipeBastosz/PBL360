import {
  ForbiddenError,
  InvalidRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository';
import {
  buildRoom,
  OWNER_ID,
  ROOM_ID,
  roomAccessStub,
  roomRepositoryStub,
} from '../../testing/room-fixtures';
import { TransferRoomOwnershipUseCase } from './transfer-room-ownership.use-case';

const NEW_OWNER_ID = 'tutor-2';

const buildTutor = (overrides: Partial<User> = {}): User =>
  Object.assign(new User(), { id: NEW_OWNER_ID, type: UserType.TUTOR, active: true }, overrides);

describe('TransferRoomOwnershipUseCase', () => {
  let rooms: ReturnType<typeof roomRepositoryStub>;
  let users: Pick<jest.Mocked<UserRepository>, 'findById'>;
  let access: ReturnType<typeof roomAccessStub>;
  let useCase: TransferRoomOwnershipUseCase;

  beforeEach(() => {
    rooms = roomRepositoryStub();
    users = { findById: jest.fn() };
    access = roomAccessStub();
    useCase = new TransferRoomOwnershipUseCase(
      rooms,
      users as unknown as UserRepository,
      access as never,
    );

    access.assertTutorIsRoomOwner.mockResolvedValue(buildRoom());
    users.findById.mockResolvedValue(buildTutor());
    rooms.hasTutor.mockResolvedValue(true);
    rooms.transferOwnership.mockResolvedValue({
      status: 'transferred',
      roomId: ROOM_ID,
      ownerId: NEW_OWNER_ID,
    });
  });

  it('transfers room ownership to an active linked tutor', async () => {
    const result = await useCase.execute({
      roomId: ROOM_ID,
      authenticatedTutorId: OWNER_ID,
      newOwnerId: NEW_OWNER_ID,
    });

    expect(access.assertTutorIsRoomOwner).toHaveBeenCalledWith(ROOM_ID, OWNER_ID);
    expect(rooms.transferOwnership).toHaveBeenCalledWith({
      roomId: ROOM_ID,
      expectedOwnerId: OWNER_ID,
      newOwnerId: NEW_OWNER_ID,
      transferredById: OWNER_ID,
    });
    expect(result).toEqual({ id: ROOM_ID, tutorId: NEW_OWNER_ID });
  });

  it('rejects when requester is not the current room owner', async () => {
    access.assertTutorIsRoomOwner.mockRejectedValue(new ForbiddenError('negado'));

    await expect(
      useCase.execute({ roomId: ROOM_ID, authenticatedTutorId: 'other', newOwnerId: NEW_OWNER_ID }),
    ).rejects.toThrow(ForbiddenError);
    expect(rooms.transferOwnership).not.toHaveBeenCalled();
  });

  it('rejects self-transfer with InvalidRequestError', async () => {
    await expect(
      useCase.execute({ roomId: ROOM_ID, authenticatedTutorId: OWNER_ID, newOwnerId: OWNER_ID }),
    ).rejects.toThrow(InvalidRequestError);
    expect(rooms.transferOwnership).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when target user does not exist or is not a tutor', async () => {
    users.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    users.findById.mockResolvedValueOnce(buildTutor({ type: UserType.STUDENT }));
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws UnprocessableEntityError when target tutor is inactive', async () => {
    users.findById.mockResolvedValue(buildTutor({ active: false }));

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
    expect(rooms.transferOwnership).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityError when target tutor is not linked to the room', async () => {
    rooms.hasTutor.mockResolvedValue(false);

    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
    expect(rooms.transferOwnership).not.toHaveBeenCalled();
  });

  it('maps concurrent repository outcomes to the expected application errors', async () => {
    rooms.transferOwnership.mockResolvedValueOnce({ status: 'not_owner' });
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(ForbiddenError);

    rooms.transferOwnership.mockResolvedValueOnce({ status: 'tutor_not_linked' });
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(UnprocessableEntityError);

    rooms.transferOwnership.mockResolvedValueOnce({ status: 'not_found' });
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    rooms.transferOwnership.mockResolvedValueOnce({ status: 'tutor_inactive' });
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(UnprocessableEntityError);

    rooms.transferOwnership.mockResolvedValueOnce({ status: 'tutor_not_found' });
    await expect(
      useCase.execute({
        roomId: ROOM_ID,
        authenticatedTutorId: OWNER_ID,
        newOwnerId: NEW_OWNER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
