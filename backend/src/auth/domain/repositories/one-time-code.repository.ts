import type { OneTimeCode } from '../entities/one-time-code';

export interface IssueHistory {
  lastIssuedAt: Date | null;
  issuedInLastHour: number;
}

export interface OneTimeCodeRepository<T extends OneTimeCode> {
  replacePendingFor(code: T): Promise<void>;
  findPendingByUserId(userId: string): Promise<T | null>;
  consumeAttempt(id: string): Promise<boolean>;
  markAsUsed(id: string): Promise<boolean>;
  issueHistoryFor(userId: string): Promise<IssueHistory>;
}
