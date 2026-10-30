import { NotFoundError, UnauthorizedError } from '@/shared/errors/application.error';
import type { PasswordHasher } from '@/auth/domain/services/password-hasher';
import { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { ChangeUserPasswordUseCase } from './change-user-password.use-case';

describe('ChangeUserPasswordUseCase', () => {
  let useCase: ChangeUserPasswordUseCase;
  let usersRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    usersRepository = {
      searchTutors: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateName: jest.fn(),
      save: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      matches: jest.fn(),
      compareWithDecoy: jest.fn(),
    };
    useCase = new ChangeUserPasswordUseCase(usersRepository, passwordHasher);
  });

  it('updates password and increments token version when current password matches', async () => {
    const user = new User();
    user.id = 'user-1';
    user.passwordHash = 'old-hash';
    user.tokenVersion = 0;
    usersRepository.findById.mockResolvedValue(user);
    passwordHasher.matches.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('new-hash');

    await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-pass',
      newPassword: 'new-pass-123',
    });

    expect(passwordHasher.matches).toHaveBeenCalledWith('current-pass', 'old-hash');
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-pass-123');
    expect(user.passwordHash).toBe('new-hash');
    expect(user.tokenVersion).toBe(1);
    expect(usersRepository.save).toHaveBeenCalledWith(user);
  });

  it('rejects when current password does not match', async () => {
    const user = new User();
    user.id = 'user-1';
    user.passwordHash = 'old-hash';
    usersRepository.findById.mockResolvedValue(user);
    passwordHasher.matches.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        currentPassword: 'wrong-pass',
        newPassword: 'new-pass-123',
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when user is not found', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'missing',
        currentPassword: 'any',
        newPassword: 'new-pass-123',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
