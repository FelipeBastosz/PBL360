import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import {
  ACCESS_TOKEN_ISSUER,
  type AccessTokenIssuer,
} from '../../domain/services/access-token-issuer';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const matches: jest.MockedFunction<PasswordHasher['matches']> = jest.fn();
  const issueFor: jest.MockedFunction<AccessTokenIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save: jest.fn() };
  const passwords: PasswordHasher = { hash: jest.fn(), matches };
  const tokens: AccessTokenIssuer = { issueFor };

  const registeredUser = (): User =>
    User.create({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
    });

  const credentials = { email: ' Ana@Discente.UEFS.br ', password: 'senha-secreta' };

  beforeEach(async () => {
    jest.resetAllMocks();
    findByEmail.mockResolvedValue(registeredUser());
    matches.mockResolvedValue(true);
    issueFor.mockResolvedValue({ value: 'jwt-token', expiresAt: new Date() });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PASSWORD_HASHER, useValue: passwords },
        { provide: ACCESS_TOKEN_ISSUER, useValue: tokens },
      ],
    }).compile();

    useCase = moduleRef.get(LoginUseCase);
  });

  it('issues a token for valid credentials', async () => {
    const session = await useCase.execute(credentials);

    expect(matches).toHaveBeenCalledWith('senha-secreta', 'hashed');
    expect(session.accessToken.value).toBe('jwt-token');
  });

  it('looks the account up by the normalised e-mail', async () => {
    await useCase.execute(credentials);

    expect(findByEmail).toHaveBeenCalledWith('ana@discente.uefs.br');
  });

  it('rejects an e-mail that is not registered', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(credentials)).rejects.toThrow(UnauthorizedException);
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('rejects a wrong password', async () => {
    matches.mockResolvedValue(false);

    await expect(useCase.execute(credentials)).rejects.toThrow(UnauthorizedException);
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('gives the same message for an unknown e-mail and a wrong password', async () => {
    matches.mockResolvedValue(false);
    const wrongPassword = await useCase.execute(credentials).catch((error: Error) => error.message);

    findByEmail.mockResolvedValue(null);
    const unknownEmail = await useCase.execute(credentials).catch((error: Error) => error.message);

    expect(wrongPassword).toBe(unknownEmail);
  });

  it('rejects a deactivated account', async () => {
    const user = registeredUser();
    user.deactivate();
    findByEmail.mockResolvedValue(user);

    await expect(useCase.execute(credentials)).rejects.toThrow('Esta conta está desativada.');
  });
});
