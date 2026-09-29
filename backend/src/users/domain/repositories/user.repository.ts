import type { User } from '../entities/user.entity';

export interface TutorSummary {
  id: string;
  name: string;
  email: string;
}

export interface UserRepository {
  searchTutors(query: string): Promise<TutorSummary[]>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
