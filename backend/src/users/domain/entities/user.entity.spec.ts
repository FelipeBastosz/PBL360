import { UserType } from '../enums/user-type.enum';
import { InvalidUserError } from '../errors/invalid-user.error';
import { User } from './user.entity';
import type { NewUser } from './new-user';
import { buildPhoto } from '../../testing/photo-fixtures';

describe('User (Domain)', () => {
  const buildUser = (type: UserType): User => {
    const user = new User();
    user.name = 'Fulano da Silva';
    user.email = 'fulano@uefs.br';
    user.passwordHash = 'hashed_password_123';
    user.registrationNumber = '12345678';
    user.type = type;
    user.active = true;
    return user;
  };

  it('should identify a tutor by its type', () => {
    const user = buildUser(UserType.TUTOR);

    expect(user.isTutor()).toBe(true);
    expect(user.isStudent()).toBe(false);
  });

  it('should identify a student by its type', () => {
    const user = buildUser(UserType.STUDENT);

    expect(user.isStudent()).toBe(true);
    expect(user.isTutor()).toBe(false);
  });

  it('should toggle active status with activate and deactivate', () => {
    const user = buildUser(UserType.STUDENT);

    user.deactivate();
    expect(user.active).toBe(false);

    user.activate();
    expect(user.active).toBe(true);
  });

  it('should replace the password hash on changePassword', () => {
    const user = buildUser(UserType.STUDENT);

    user.changePassword('new_hashed_password');

    expect(user.passwordHash).toBe('new_hashed_password');
  });

  describe('rename', () => {
    it('updates user name and trims whitespace', () => {
      const user = buildUser(UserType.STUDENT);

      user.rename('  Novo Nome de Aluno  ');

      expect(user.name).toBe('Novo Nome de Aluno');
    });

    it('rejects names shorter than 3 characters', () => {
      const user = buildUser(UserType.STUDENT);

      expect(() => user.rename('ab')).toThrow(InvalidUserError);
      expect(() => user.rename('ab')).toThrow('O nome deve ter entre 3 e 120 caracteres.');
    });

    it('rejects names longer than 120 characters', () => {
      const user = buildUser(UserType.STUDENT);

      expect(() => user.rename('a'.repeat(121))).toThrow(InvalidUserError);
    });

    it('rejects empty or whitespace-only names', () => {
      const user = buildUser(UserType.STUDENT);

      expect(() => user.rename('   ')).toThrow(InvalidUserError);
    });
  });

  describe('create', () => {
    const newStudent = (overrides: Partial<NewUser> = {}): NewUser => ({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed_password_123',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photo: buildPhoto(),
      ...overrides,
    });

    const newTutor = (overrides: Partial<NewUser> = {}): NewUser => ({
      name: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      passwordHash: 'hashed_password_123',
      type: UserType.TUTOR,
      ...overrides,
    });

    it('accepts a staff address on @uefs.br', () => {
      expect(User.create(newTutor()).email).toBe('carlos@uefs.br');
    });

    it('accepts a student address on @discente.uefs.br', () => {
      expect(User.create(newStudent()).email).toBe('ana@discente.uefs.br');
    });

    it('lowercases and trims the e-mail so lookups always match', () => {
      expect(User.create(newTutor({ email: '  Carlos@UEFS.BR ' })).email).toBe('carlos@uefs.br');
    });

    it('rejects an address outside the university domains', () => {
      expect(() => User.create(newTutor({ email: 'carlos@gmail.com' }))).toThrow(InvalidUserError);
    });

    it('rejects a domain that merely ends in uefs.br', () => {
      expect(() => User.create(newTutor({ email: 'carlos@naouefs.br' }))).toThrow(InvalidUserError);
    });

    it('starts every account pending e-mail verification', () => {
      const user = User.create(newTutor());

      expect(user.active).toBe(false);
      expect(user.isPendingVerification()).toBe(true);
    });

    it('is no longer pending once activated', () => {
      const user = User.create(newTutor());
      user.activate();

      expect(user.isPendingVerification()).toBe(false);
    });

    it('leaves the tutor registration number and photo empty', () => {
      const tutor = User.create(newTutor());

      expect(tutor.registrationNumber).toBeNull();
      expect(tutor.hasPhoto).toBe(false);
      expect(tutor.pendingPhoto).toBeNull();
    });

    it('keeps the student photo pending until it is persisted', () => {
      const photo = buildPhoto();
      const student = User.create(newStudent({ photo }));

      expect(student.hasPhoto).toBe(true);
      expect(student.pendingPhoto).toBe(photo);
    });

    it('accepts a tutor that does carry a registration number', () => {
      const tutor = User.create(newTutor({ registrationNumber: '19990001' }));

      expect(tutor.registrationNumber).toBe('19990001');
    });

    it('rejects a student without a registration number', () => {
      expect(() => User.create(newStudent({ registrationNumber: null }))).toThrow(
        'A matrícula é obrigatória para alunos.',
      );
    });

    it('rejects a student without a photo', () => {
      expect(() => User.create(newStudent({ photo: null }))).toThrow(
        'A foto é obrigatória para alunos.',
      );
    });

    it('rejects a registration number that is not eight digits', () => {
      expect(() => User.create(newStudent({ registrationNumber: '2024' }))).toThrow(
        'A matrícula deve conter exatamente 8 dígitos.',
      );
    });

    it('rejects a registration number with non-digits', () => {
      expect(() => User.create(newStudent({ registrationNumber: '2024000a' }))).toThrow(
        InvalidUserError,
      );
    });

    describe('institutional e-mail by account type', () => {
      it('does not let a tutor use a student address', () => {
        expect(() => User.create(newTutor({ email: 'carlos@discente.uefs.br' }))).toThrow(
          'Professores devem usar o e-mail institucional @uefs.br.',
        );
      });

      it('does not let a student use a staff address', () => {
        expect(() => User.create(newStudent({ email: 'ana@uefs.br' }))).toThrow(
          'Alunos devem usar o e-mail institucional @discente.uefs.br.',
        );
      });
    });

    describe('session revocation', () => {
      it('starts with token version zero', () => {
        expect(User.create(newTutor()).tokenVersion).toBe(0);
      });

      it('revokes sessions when the password changes', () => {
        const user = User.create(newTutor());

        user.changePassword('new-hash');

        expect(user.passwordHash).toBe('new-hash');
        expect(user.tokenVersion).toBe(1);
      });

      it('revokes sessions when the account is deactivated', () => {
        const user = User.create(newTutor());
        user.activate();

        user.deactivate();

        expect(user.tokenVersion).toBe(1);
      });
    });
  });
});
