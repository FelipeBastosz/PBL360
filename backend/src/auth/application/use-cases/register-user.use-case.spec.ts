import { ConflictError } from '@/shared/errors/application.error';
import { InvalidUserError } from '@/users/domain/errors/invalid-user.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { User } from '@/users/domain/entities/user.entity';
import { CommitmentTerm } from '@/commitment-terms/domain/entities/commitment-term.entity';
import type { CommitmentTermRepository } from '@/commitment-terms/domain/repositories/commitment-term.repository';
import { pngPhotoBytes } from '@/users/testing/photo-fixtures';
import type { EmailVerificationCodes } from '../services/email-verification-codes';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import { buildStudent, codeServiceStub, userRepositoryStub } from '../../testing/auth-fixtures';
import { RegisterUserUseCase } from './register-user.use-case';

const tutorInput = {
  name: 'Carlos Mendes',
  email: ' Carlos@UEFS.br ',
  password: 'senha-secreta',
  type: UserType.TUTOR,
  acceptedTermVersion: '1.2',
  acceptsTerms: true,
};

const studentInput = {
  name: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  password: 'senha-secreta',
  type: UserType.STUDENT,
  acceptedTermVersion: '1.2',
  acceptsTerms: true,
  registrationNumber: '20240001',
};

describe('RegisterUserUseCase', () => {
  let users: ReturnType<typeof userRepositoryStub>;
  let codes: ReturnType<typeof codeServiceStub>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = userRepositoryStub();
    users.findByEmail.mockResolvedValue(null);
    users.saveWithTermAcceptance.mockImplementation((user: User) =>
      Promise.resolve(Object.assign(user, { id: 'u', hasPhoto: Boolean(user.pendingPhoto) })),
    );
    codes = codeServiceStub();
    const passwords: PasswordHasher = {
      hash: jest.fn().mockResolvedValue('hashed'),
      matches: jest.fn(),
      compareWithDecoy: jest.fn(),
    };
    const currentTerm = Object.assign(new CommitmentTerm(), { id: 'term-1', version: '1.2' });
    const commitmentTerms = {
      findCurrent: jest.fn().mockResolvedValue(currentTerm),
      findByVersion: jest.fn(),
    } as unknown as CommitmentTermRepository;
    useCase = new RegisterUserUseCase(
      users,
      passwords,
      codes as unknown as EmailVerificationCodes,
      commitmentTerms,
    );
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
    expect(users.saveWithTermAcceptance).not.toHaveBeenCalled();
  });

  it('does not let a student e-mail register as tutor', async () => {
    await expect(useCase.execute({ ...tutorInput, email: 'ana@discente.uefs.br' })).rejects.toThrow(
      new InvalidUserError('Professores devem usar o e-mail institucional @uefs.br.'),
    );
    expect(users.saveWithTermAcceptance).not.toHaveBeenCalled();
  });

  it('hands the uploaded photo to the repository alongside the student', async () => {
    const user = await useCase.execute({ ...studentInput, photo: pngPhotoBytes() });

    expect(user.hasPhoto).toBe(true);
    expect(users.saveWithTermAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingPhoto: expect.objectContaining({ mimeType: 'image/png' }) as unknown,
      }),
      'term-1',
      '1.2',
    );
  });

  it('rejects a student without a photo', async () => {
    await expect(useCase.execute(studentInput)).rejects.toThrow(
      new InvalidUserError('A foto é obrigatória para alunos.'),
    );
    expect(users.saveWithTermAcceptance).not.toHaveBeenCalled();
  });

  it('rejects a photo that is not an accepted image before storing anything', async () => {
    const photo = Buffer.from('não é uma imagem');

    await expect(useCase.execute({ ...studentInput, photo })).rejects.toThrow(
      new InvalidUserError('A foto deve ser uma imagem JPEG, PNG ou WebP.'),
    );
    expect(users.saveWithTermAcceptance).not.toHaveBeenCalled();
  });
});
