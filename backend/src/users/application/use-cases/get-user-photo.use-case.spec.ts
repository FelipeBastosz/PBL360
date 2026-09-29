import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import type { UserPhotoRepository } from '../../domain/repositories/user-photo.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { buildPhoto } from '../../testing/photo-fixtures';
import { GetUserPhotoUseCase } from './get-user-photo.use-case';

const STUDENT_ID = 'student-1';
const OTHER_ID = 'other-1';

describe('GetUserPhotoUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let photos: jest.Mocked<UserPhotoRepository>;
  let useCase: GetUserPhotoUseCase;

  const requesterOfType = (type: UserType): User =>
    Object.assign(new User(), { id: OTHER_ID, type });

  beforeEach(() => {
    users = { findByEmail: jest.fn(), findById: jest.fn(), save: jest.fn() };
    photos = { findByUserId: jest.fn().mockResolvedValue(buildPhoto()) };
    useCase = new GetUserPhotoUseCase(users, photos);
  });

  it('hands users their own photo without looking them up again', async () => {
    const photo = await useCase.execute({ userId: STUDENT_ID, requesterId: STUDENT_ID });

    expect(photo.mimeType).toBe('image/png');
    expect(photos.findByUserId).toHaveBeenCalledWith(STUDENT_ID);
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('lets a tutor see the photo of a student', async () => {
    users.findById.mockResolvedValue(requesterOfType(UserType.TUTOR));

    await expect(
      useCase.execute({ userId: STUDENT_ID, requesterId: OTHER_ID }),
    ).resolves.toBeDefined();
  });

  it('does not let a student see the photo of someone else', async () => {
    users.findById.mockResolvedValue(requesterOfType(UserType.STUDENT));

    await expect(
      useCase.execute({ userId: STUDENT_ID, requesterId: OTHER_ID }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(photos.findByUserId).not.toHaveBeenCalled();
  });

  it('answers not found when there is no photo', async () => {
    photos.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ userId: STUDENT_ID, requesterId: STUDENT_ID })).rejects.toThrow(
      new NotFoundError('Foto não encontrada.'),
    );
  });
});
