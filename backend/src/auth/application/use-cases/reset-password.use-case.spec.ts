import { InvalidRequestError } from '@/shared/errors/application.error';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { PasswordResetTokenIssuer } from '../../domain/services/password-reset-token-issuer';
import { buildActiveStudent, userRepositoryStub } from '../../testing/auth-fixtures';
import { ResetPasswordUseCase } from './reset-password.use-case';

const input = { resetToken: 'reset-jwt', newPassword: 'nova-senha-secreta' };

describe('ResetPasswordUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let tokens: jest.Mocked<PasswordResetTokenIssuer>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    tokens = { issueFor: jest.fn(), verify: jest.fn() };
    const hasher: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('new-hash'),
      matches: jest.fn(),
      compareWithDecoy: jest.fn(),
    };
    useCase = new ResetPasswordUseCase(users, tokens, hasher);
  });

  it('changes the password and revokes every open session', async () => {
    const user = buildActiveStudent({ tokenVersion: 2 });
    users.findById.mockResolvedValue(user);
    tokens.verify.mockResolvedValue({ userId: 'user-1', tokenVersion: 2 });

    await useCase.execute(input);

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'new-hash', tokenVersion: 3 }),
    );
  });

  it('refuses a token issued before the last password change', async () => {
    users.findById.mockResolvedValue(buildActiveStudent({ tokenVersion: 3 }));
    tokens.verify.mockResolvedValue({ userId: 'user-1', tokenVersion: 2 });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(InvalidRequestError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('refuses an invalid token', async () => {
    tokens.verify.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      new InvalidRequestError('Token de redefinição inválido ou expirado.'),
    );
  });
});
