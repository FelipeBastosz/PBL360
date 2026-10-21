import { NotFoundError } from '@/shared/errors/application.error';
import { User } from '../../domain/entities/user.entity';
import { InvalidUserError } from '../../domain/errors/invalid-user.error';
import type { UserPhotoRepository } from '../../domain/repositories/user-photo.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { pngPhotoBytes } from '../../testing/photo-fixtures';
import { UploadUserPhotoUseCase } from './upload-user-photo.use-case';

describe('UploadUserPhotoUseCase', () => {
  let useCase: UploadUserPhotoUseCase;
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
    useCase = new UploadUserPhotoUseCase(usersRepository, photosRepository);
  });

  it('saves valid photo for existing user', async () => {
    const user = new User();
    user.id = 'user-1';
    usersRepository.findById.mockResolvedValue(user);

    await useCase.execute({ userId: 'user-1', bytes: pngPhotoBytes() });

    expect(photosRepository.save).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ mimeType: 'image/png' }),
    );
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing', bytes: pngPhotoBytes() })).rejects.toThrow(
      NotFoundError,
    );
    expect(photosRepository.save).not.toHaveBeenCalled();
  });

  it('rejects invalid photo bytes and does not save', async () => {
    const user = new User();
    user.id = 'user-1';
    usersRepository.findById.mockResolvedValue(user);

    await expect(
      useCase.execute({ userId: 'user-1', bytes: Buffer.from('invalid data') }),
    ).rejects.toThrow(InvalidUserError);
    expect(photosRepository.save).not.toHaveBeenCalled();
  });

  it('rejects when photo bytes are empty or undefined', async () => {
    await expect(useCase.execute({ userId: 'user-1', bytes: Buffer.alloc(0) })).rejects.toThrow(
      'Envie uma única foto no campo "foto".',
    );
  });
});
