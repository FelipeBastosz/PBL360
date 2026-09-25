import { InvalidRequestError } from '@/shared/errors/application.error';
import type { EmailVerificationCodes } from '../services/email-verification-codes';
import type { AccessTokenIssuer } from '../../domain/services/access-token-issuer';
import {
  buildActiveStudent,
  buildStudent,
  codeServiceStub,
  userRepositoryStub,
} from '../../testing/auth-fixtures';
import { VerifyEmailCodeUseCase } from './verify-email-code.use-case';

const input = { userId: 'user-1', email: ' ANA@discente.uefs.br ', code: '123456' };
const accessToken = { value: 'jwt', expiresAt: new Date('2026-01-02') };

describe('VerifyEmailCodeUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let tokens: jest.Mocked<AccessTokenIssuer>;
  let useCase: VerifyEmailCodeUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    users.findById.mockResolvedValue(buildStudent());
    codes = codeServiceStub();
    tokens = { issueFor: jest.fn().mockResolvedValue(accessToken) };
    useCase = new VerifyEmailCodeUseCase(users, codes as unknown as EmailVerificationCodes, tokens);
  });

  it('activates the account and opens a session when the code is redeemed', async () => {
    codes.redeem.mockResolvedValue({ id: 'code-1' });

    const session = await useCase.execute(input);

    expect(codes.redeem).toHaveBeenCalledWith('user-1', '123456');
    expect(session.user.active).toBe(true);
    expect(session.accessToken).toBe(accessToken);
  });

  it('rejects a code that could not be redeemed', async () => {
    codes.redeem.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      new InvalidRequestError('Código de verificação inválido ou expirado.'),
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  it('rejects an e-mail that does not belong to the account', async () => {
    await expect(
      useCase.execute({ ...input, email: 'outra@discente.uefs.br' }),
    ).rejects.toBeInstanceOf(InvalidRequestError);
    expect(codes.redeem).not.toHaveBeenCalled();
  });

  it('rejects an account that is already active', async () => {
    users.findById.mockResolvedValue(buildActiveStudent());

    await expect(useCase.execute(input)).rejects.toThrow(
      new InvalidRequestError('Esta conta já foi verificada.'),
    );
  });
});
