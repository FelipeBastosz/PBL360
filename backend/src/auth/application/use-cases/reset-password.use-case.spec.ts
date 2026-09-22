import { BadRequestException } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { PasswordResetTokenIssuer } from '../../domain/services/password-reset-token-issuer';
import { ResetPasswordUseCase } from './reset-password.use-case';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;

  const findById: jest.MockedFunction<UserRepository['findById']> = jest.fn();
  const save: jest.MockedFunction<UserRepository['save']> = jest.fn();
  const verify: jest.MockedFunction<PasswordResetTokenIssuer['verify']> = jest.fn();
  const hash: jest.MockedFunction<PasswordHasher['hash']> = jest.fn();

  const users: UserRepository = { findByEmail: jest.fn(), findById, save };
  const tokens = { issueFor: jest.fn(), verify } as unknown as PasswordResetTokenIssuer;
  const hasher: PasswordHasher = { hash, matches: jest.fn() };

  const existingUser = (): User => {
    const user = User.create({
      name: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      passwordHash: 'old_hash',
      type: UserType.TUTOR,
    });
    user.id = 'user-1';

    return user;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    verify.mockResolvedValue('user-1');
    findById.mockResolvedValue(existingUser());
    hash.mockResolvedValue('new_hash');
    save.mockImplementation((user) => Promise.resolve(user));

    useCase = new ResetPasswordUseCase(users, tokens, hasher);
  });

  it('applies the new hashed password', async () => {
    await useCase.execute({ resetToken: 'reset-token', newPassword: 'nova-senha-123' });

    expect(hash).toHaveBeenCalledWith('nova-senha-123');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'new_hash' }));
  });

  it('rejects an invalid or expired token', async () => {
    verify.mockResolvedValue(null);

    await expect(
      useCase.execute({ resetToken: 'bad-token', newPassword: 'nova-senha-123' }),
    ).rejects.toThrow(BadRequestException);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a token whose user no longer exists', async () => {
    findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ resetToken: 'reset-token', newPassword: 'nova-senha-123' }),
    ).rejects.toThrow(BadRequestException);
  });
});
