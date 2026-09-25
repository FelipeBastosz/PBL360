import { InvalidRequestError } from '@/shared/errors/application.error';
import type { PasswordResetCodes } from '../services/password-reset-codes';
import type { PasswordResetTokenIssuer } from '../../domain/services/password-reset-token-issuer';
import {
  buildActiveStudent,
  codeServiceStub,
  userRepositoryStub,
} from '../../testing/auth-fixtures';
import { ValidatePasswordResetCodeUseCase } from './validate-password-reset-code.use-case';

const resetToken = { value: 'reset-jwt', expiresAt: new Date('2026-01-02') };

describe('ValidatePasswordResetCodeUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let tokens: jest.Mocked<PasswordResetTokenIssuer>;
  let useCase: ValidatePasswordResetCodeUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    codes = codeServiceStub();
    tokens = { issueFor: jest.fn().mockResolvedValue(resetToken), verify: jest.fn() };
    useCase = new ValidatePasswordResetCodeUseCase(
      users,
      codes as unknown as PasswordResetCodes,
      tokens,
    );
  });

  it('exchanges a redeemed code for a token bound to the current token version', async () => {
    users.findByEmail.mockResolvedValue(buildActiveStudent({ tokenVersion: 3 }));
    codes.redeem.mockResolvedValue({ id: 'code-1' });

    await expect(
      useCase.execute({ email: ' ANA@discente.uefs.br ', code: '123456' }),
    ).resolves.toBe(resetToken);
    expect(tokens.issueFor).toHaveBeenCalledWith({ userId: 'user-1', tokenVersion: 3 });
  });

  it('rejects a code that could not be redeemed', async () => {
    users.findByEmail.mockResolvedValue(buildActiveStudent());
    codes.redeem.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'ana@discente.uefs.br', code: '000000' }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
  });

  it('rejects an unknown e-mail the same way', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'x@discente.uefs.br', code: '123456' })).rejects.toThrow(
      new InvalidRequestError('Código de recuperação inválido ou expirado.'),
    );
    expect(codes.redeem).not.toHaveBeenCalled();
  });
});
