import { UserType } from '../enums/user-type.enum';
import { InvalidUserError } from '../errors/invalid-user.error';
import { User } from './user.entity';
import type { NewUser } from './new-user';

describe('User (Domain)', () => {
  const buildUser = (type: UserType): User => {
    const user = new User();
    user.name = 'Fulano da Silva';
    user.email = 'fulano@uefs.br';
    user.passwordHash = 'hashed_password_123';
    user.registrationNumber = '12345678';
    user.photoUrl = 'https://example.com/photo.png';
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

  describe('create', () => {
    const newStudent = (overrides: Partial<NewUser> = {}): NewUser => ({
      name: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      passwordHash: 'hashed_password_123',
      type: UserType.STUDENT,
      registrationNumber: '20240001',
      photoUrl: 'https://example.com/ana.png',
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

    it('starts every account active', () => {
      expect(User.create(newTutor()).active).toBe(true);
    });

    it('leaves the tutor registration number and photo null', () => {
      const tutor = User.create(newTutor());

      expect(tutor.registrationNumber).toBeNull();
      expect(tutor.photoUrl).toBeNull();
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
      expect(() => User.create(newStudent({ photoUrl: null }))).toThrow(
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
  });
});
