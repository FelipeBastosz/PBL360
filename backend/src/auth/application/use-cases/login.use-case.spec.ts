import { UnauthorizedError } from '@/shared/errors/application.error';
import { AccountPendingVerificationError } from '../errors/account-pending-verification.error';
import type { AccessTokenIssuer } from '../../domain/services/access-token-issuer';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { buildActiveStudent, buildStudent, userRepositoryStub } from '../../testing/auth-fixtures';
import { LoginUseCase } from './login.use-case';

const credentials = { email: ' ANA@discente.uefs.br ', password: 'senha-secreta' };
const accessToken = { value: 'jwt', expiresAt: new Date('2026-01-02') };

describe('LoginUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let passwords: jest.Mocked<PasswordHasher>;
  let tokens: jest.Mocked<AccessTokenIssuer>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    passwords = {
      hash: jest.fn(),
      matches: jest.fn().mockResolvedValue(true),
      compareWithDecoy: jest.fn().mockResolvedValue(undefined),
    };
    tokens = { issueFor: jest.fn().mockResolvedValue(accessToken) };
    useCase = new LoginUseCase(users, passwords, tokens);
  });

  it('opens a session for valid credentials, normalizing the e-mail', async () => {
    const user = buildActiveStudent();
    users.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute(credentials)).resolves.toEqual({ user, accessToken });
    expect(users.findByEmail).toHaveBeenCalledWith('ana@discente.uefs.br');
    expect(passwords.matches).toHaveBeenCalledWith('senha-secreta', 'stored-hash');
  });

  it('rejects a wrong password', async () => {
    users.findByEmail.mockResolvedValue(buildActiveStudent());
    passwords.matches.mockResolvedValue(false);

    await expect(useCase.execute(credentials)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('spends the same hashing time when the e-mail is unknown', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(credentials)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(passwords.compareWithDecoy).toHaveBeenCalledWith('senha-secreta');
  });

  it('answers unknown e-mail and wrong password with the same message', async () => {
    users.findByEmail.mockResolvedValue(null);
    const unknown = await useCase.execute(credentials).catch((error: Error) => error.message);

    users.findByEmail.mockResolvedValue(buildActiveStudent());
    passwords.matches.mockResolvedValue(false);
    const wrong = await useCase.execute(credentials).catch((error: Error) => error.message);

    expect(unknown).toBe(wrong);
  });

  it('tells a pending account how to finish the verification', async () => {
    users.findByEmail.mockResolvedValue(buildStudent());

    const error = await useCase.execute(credentials).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(AccountPendingVerificationError);
    expect(error).toMatchObject({ userId: 'user-1', email: 'ana@discente.uefs.br' });
    expect(tokens.issueFor).not.toHaveBeenCalled();
  });
});
