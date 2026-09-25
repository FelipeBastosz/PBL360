import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';

export const userRepositoryStub = (): jest.Mocked<UserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn((user: User) => Promise.resolve(user)),
});

export const buildStudent = (overrides: Partial<User> = {}): User => {
  const user = User.create({
    name: 'Ana Souza',
    email: 'ana@discente.uefs.br',
    passwordHash: 'stored-hash',
    type: UserType.STUDENT,
    registrationNumber: '20240001',
    photoUrl: 'https://example.com/ana.png',
  });

  return Object.assign(user, { id: 'user-1' }, overrides);
};

export const buildActiveStudent = (overrides: Partial<User> = {}): User => {
  const user = buildStudent(overrides);
  user.activate();

  return user;
};

export const codeServiceStub = () => ({
  issueFor: jest.fn().mockResolvedValue(true),
  redeem: jest.fn(),
});
