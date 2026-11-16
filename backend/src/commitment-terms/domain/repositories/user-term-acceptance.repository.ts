import type { UserTermAcceptance } from '../entities/user-term-acceptance.entity';

export interface UserTermAcceptanceRepository {
  findByUserId(userId: string): Promise<UserTermAcceptance | null>;
  hasAccepted(userId: string): Promise<boolean>;
  create(acceptance: UserTermAcceptance): Promise<UserTermAcceptance>;
}

export const USER_TERM_ACCEPTANCE_REPOSITORY = Symbol('UserTermAcceptanceRepository');
