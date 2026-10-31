import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { UserType } from '../../domain/enums/user-type.enum';
import type { UserPhotoRepository } from '../../domain/repositories/user-photo.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { DeleteUserPhotoUseCase } from './delete-user-photo.use-case';

describe('DeleteUserPhotoUseCase', () => {
  let useCase: DeleteUserPhotoUseCase;
  let usersRepository: jest.Mocked<UserRepository>;
  let photosRepository: jest.Mocked<UserPhotoRepository>;

  beforeEach(() => {
    usersRepository = {
      searchTutors: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    photosRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    useCase = new DeleteUserPhotoUseCase(usersRepository, photosRepository);
  });

  it('deletes photo for tutor', async () => {
    const user = new User();
    user.id = 'user-1';
    user.type = UserType.TUTOR;
    usersRepository.findById.mockResolvedValue(user);

    await useCase.execute({ userId: 'user-1' });

    expect(photosRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('rejects photo deletion for student', async () => {
    const user = new User();
    user.id = 'user-student';
    user.type = UserType.STUDENT;
    usersRepository.findById.mockResolvedValue(user);

    await expect(useCase.execute({ userId: 'user-student' })).rejects.toThrow(ForbiddenError);
    expect(photosRepository.deleteByUserId).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing' })).rejects.toThrow(NotFoundError);
    expect(photosRepository.deleteByUserId).not.toHaveBeenCalled();
  });
});
