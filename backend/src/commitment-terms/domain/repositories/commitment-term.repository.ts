import type { CommitmentTerm } from '../entities/commitment-term.entity';

export interface CommitmentTermRepository {
  findCurrent(): Promise<CommitmentTerm | null>;
  findByVersion(version: string): Promise<CommitmentTerm | null>;
}

export const COMMITMENT_TERM_REPOSITORY = Symbol('CommitmentTermRepository');
