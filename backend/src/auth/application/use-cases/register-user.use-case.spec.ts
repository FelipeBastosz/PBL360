import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { InvalidUserError } from '@/users/domain/errors/invalid-user.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/services/password-hasher';
import { VerificationCodeIssuer } from '../services/verification-code-issuer';
import { RegisterUserUseCase, type RegisterUserInput } from './register-user.use-case';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const save: jest.MockedFunction<UserRepository['save']> = jest.fn();
  const hash: jest.MockedFunction<PasswordHasher['hash']> = jest.fn();
  const issueFor: jest.MockedFunction<VerificationCodeIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save };
  const passwords: PasswordHasher = { hash, matches: jest.fn() };
  const issuer = { issueFor } as unknown as VerificationCodeIssuer;

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
    issueFor.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: users },
        { provide: PASSWORD_HASHER, useValue: passwords },
        { provide: VerificationCodeIssuer, useValue: issuer },
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
    const user = await useCase.execute(studentInput());

    expect(issueFor).toHaveBeenCalledWith(user);
    expect(issueFor.mock.calls[0][0].id).toBe('user-1');
  });

  it('creates the account pending verification and hands back no token', async () => {
    const user = await useCase.execute(tutorInput());

    expect(save.mock.calls[0][0].active).toBe(false);
    expect(user.isPendingVerification()).toBe(true);
    expect(user).not.toHaveProperty('accessToken');
  });
});
