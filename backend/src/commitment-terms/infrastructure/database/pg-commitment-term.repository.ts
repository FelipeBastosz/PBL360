import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstRowOrNull } from '@/shared/database/rows';
import { CommitmentTerm } from '../../domain/entities/commitment-term.entity';
import type { CommitmentTermRepository } from '../../domain/repositories/commitment-term.repository';

interface CommitmentTermRow {
  id: string;
  version: string;
  title: string;
  content: string;
  isCurrent: boolean;
  createdAt: Date;
}

const COMMITMENT_TERM_COLUMNS = `
  id,
  version,
  title,
  content,
  is_current AS "isCurrent",
  created_at AS "createdAt"
`;

const toEntity = (row: CommitmentTermRow): CommitmentTerm =>
  Object.assign(new CommitmentTerm(), row);

@Injectable()
export class PgCommitmentTermRepository implements CommitmentTermRepository {
  constructor(
    @InjectRepository(CommitmentTerm)
    private readonly repository: Repository<CommitmentTerm>,
  ) {}

  async findCurrent(): Promise<CommitmentTerm | null> {
    const rows = await this.repository.query<CommitmentTermRow[]>(
      `SELECT ${COMMITMENT_TERM_COLUMNS}
       FROM commitment_terms
       WHERE is_current = TRUE
       LIMIT 1;`,
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }

  async findByVersion(version: string): Promise<CommitmentTerm | null> {
    const rows = await this.repository.query<CommitmentTermRow[]>(
      `SELECT ${COMMITMENT_TERM_COLUMNS}
       FROM commitment_terms
       WHERE version = $1
       LIMIT 1;`,
      [version],
    );
    const row = firstRowOrNull(rows);
    return row ? toEntity(row) : null;
  }
}
