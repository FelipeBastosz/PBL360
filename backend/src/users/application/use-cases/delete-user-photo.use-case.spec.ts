import { NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
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

  it('deletes photo for existing user', async () => {
    const user = new User();
    user.id = 'user-1';
    usersRepository.findById.mockResolvedValue(user);

    await useCase.execute({ userId: 'user-1' });

    expect(photosRepository.deleteByUserId).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing' })).rejects.toThrow(NotFoundError);
    expect(photosRepository.deleteByUserId).not.toHaveBeenCalled();
  });
});
