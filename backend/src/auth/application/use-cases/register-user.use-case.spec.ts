import { ConflictException, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { InvalidUserError } from '@/users/domain/errors/invalid-user.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import {
  ACCESS_TOKEN_ISSUER,
  type AccessTokenIssuer,
} from '../../domain/services/access-token-issuer';
import {
  EMAIL_VERIFICATION_SENDER,
  type EmailVerificationSender,
} from '../../domain/services/email-verification-sender';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { RegisterUserUseCase, type RegisterUserInput } from './register-user.use-case';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const save: jest.MockedFunction<UserRepository['save']> = jest.fn();
  const hash: jest.MockedFunction<PasswordHasher['hash']> = jest.fn();
  const issueFor: jest.MockedFunction<AccessTokenIssuer['issueFor']> = jest.fn();
  const sendVerificationCode: jest.MockedFunction<EmailVerificationSender['sendVerificationCode']> =
    jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save };
  const passwords: PasswordHasher = { hash, matches: jest.fn() };
  const tokens: AccessTokenIssuer = { issueFor };
  const verification: EmailVerificationSender = { sendVerificationCode };

  const tutorInput = (): RegisterUserInput => ({
    name: 'Carlos Mendes',
    email: 'Carlos@UEFS.BR',
    password: 'senha-secreta',
    type: UserType.TUTOR,
  });

  const studentInput = (): RegisterUserInput => ({
    name: 'Ana Souza',
    email: 'ana@discente.uefs.br',
    password: 'senha-secreta',
    type: UserType.STUDENT,
    registrationNumber: '20240001',
    photoUrl: 'https://example.com/ana.png',
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    findByEmail.mockResolvedValue(null);
    save.mockImplementation((user) => Promise.resolve(Object.assign(user, { id: 'user-1' })));
    hash.mockResolvedValue('hashed');
    issueFor.mockResolvedValue({ value: 'jwt-token', expiresAt: new Date() });
    sendVerificationCode.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PASSWORD_HASHER, useValue: passwords },
        { provide: ACCESS_TOKEN_ISSUER, useValue: tokens },
        { provide: EMAIL_VERIFICATION_SENDER, useValue: verification },
      ],
    }).compile();

    useCase = moduleRef.get(RegisterUserUseCase);
  });

  it('stores the hash and never the plain password', async () => {
    await useCase.execute(tutorInput());

    expect(hash).toHaveBeenCalledWith('senha-secreta');
    expect(save.mock.calls[0][0].passwordHash).toBe('hashed');
  });

  it('normalises the e-mail before looking it up and before saving', async () => {
    await useCase.execute(tutorInput());

    expect(findByEmail).toHaveBeenCalledWith('carlos@uefs.br');
    expect(save.mock.calls[0][0].email).toBe('carlos@uefs.br');
  });

  it('leaves the tutor photo and registration number empty', async () => {
    await useCase.execute(tutorInput());

    const saved = save.mock.calls[0][0];
    expect(saved.registrationNumber).toBeNull();
    expect(saved.photoUrl).toBeNull();
  });

  it('keeps the student photo and registration number', async () => {
    await useCase.execute(studentInput());

    const saved = save.mock.calls[0][0];
    expect(saved.registrationNumber).toBe('20240001');
    expect(saved.photoUrl).toBe('https://example.com/ana.png');
  });

  it('rejects an e-mail that is already registered', async () => {
    findByEmail.mockResolvedValue(new User());

    await expect(useCase.execute(tutorInput())).rejects.toThrow(ConflictException);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects a student without a registration number', async () => {
    const input = { ...studentInput(), registrationNumber: null };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidUserError);
    expect(save).not.toHaveBeenCalled();
  });

  it('asks for a verification code for the persisted user', async () => {
    await useCase.execute(studentInput());

    expect(sendVerificationCode).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
    });
  });

  it('still registers the account when the verification e-mail fails', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    sendVerificationCode.mockRejectedValue(new Error('smtp is down'));

    await expect(useCase.execute(studentInput())).resolves.toMatchObject({
      accessToken: { value: 'jwt-token' },
    });

    jest.restoreAllMocks();
  });

  it('issues a token for the persisted user', async () => {
    const session = await useCase.execute(tutorInput());

    expect(issueFor).toHaveBeenCalledWith(session.user);
    expect(session.accessToken.value).toBe('jwt-token');
  });
});
