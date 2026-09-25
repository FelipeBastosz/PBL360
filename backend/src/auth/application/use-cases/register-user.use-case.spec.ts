import { ConflictError } from '@/shared/errors/application.error';
import { InvalidUserError } from '@/users/domain/errors/invalid-user.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { User } from '@/users/domain/entities/user.entity';
import type { EmailVerificationCodes } from '../services/email-verification-codes';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { buildStudent, codeServiceStub, userRepositoryStub } from '../../testing/auth-fixtures';
import { RegisterUserUseCase } from './register-user.use-case';

const tutorInput = {
  name: 'Carlos Mendes',
  email: ' Carlos@UEFS.br ',
  password: 'senha-secreta',
  type: UserType.TUTOR,
};

describe('RegisterUserUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    users.findByEmail.mockResolvedValue(null);
    users.save.mockImplementation((user: User) =>
      Promise.resolve(Object.assign(user, { id: 'u' })),
    );
    codes = codeServiceStub();
    const passwords: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hashed'),
      matches: jest.fn(),
      compareWithDecoy: jest.fn(),
    };
    useCase = new RegisterUserUseCase(users, passwords, codes as unknown as EmailVerificationCodes);
  });

  it('stores a pending account with the hashed password and sends a code', async () => {
    const user = await useCase.execute(tutorInput);

    expect(user).toMatchObject({ email: 'carlos@uefs.br', passwordHash: 'hashed', active: false });
    expect(user.isPendingVerification()).toBe(true);
    expect(codes.issueFor).toHaveBeenCalledWith(user);
  });

  it('rejects an e-mail already registered', async () => {
    users.findByEmail.mockResolvedValue(buildStudent());

    await expect(useCase.execute(tutorInput)).rejects.toBeInstanceOf(ConflictError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('does not let a student e-mail register as tutor', async () => {
    await expect(useCase.execute({ ...tutorInput, email: 'ana@discente.uefs.br' })).rejects.toThrow(
      new InvalidUserError('Professores devem usar o e-mail institucional @uefs.br.'),
    );
    expect(users.save).not.toHaveBeenCalled();
  });
});
