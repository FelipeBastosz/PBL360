import { UserType } from '../enums/user-type.enum';
import { User } from './user.entity';

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
});
