import type { User } from '../entities/user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByID(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export const UserRepositoryToken = Symbol('IUserRepository');
