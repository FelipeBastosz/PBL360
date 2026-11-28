import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionGeneralEvaluation } from '../../domain/entities/session-general-evaluation.entity';
import type {
  SessionGeneralEvaluationRecord,
  SessionGeneralEvaluationRepository,
} from '../../domain/repositories/session-general-evaluation.repository';
import { requireFirstRow } from '@/shared/database/rows';

interface SessionGeneralEvaluationRow extends SessionGeneralEvaluation {
  authorId: string;
  authorName: string;
}

const SELECT_EVALUATION = `
  SELECT evaluation.id, evaluation.session_id AS "sessionId", evaluation.text,
    evaluation.created_by AS "createdBy", evaluation.updated_by AS "updatedBy",
    evaluation.created_at AS "createdAt", evaluation.updated_at AS "updatedAt",
    evaluation.created_by AS "authorId", users.name AS "authorName"
  FROM session_general_evaluations evaluation
  JOIN users ON users.id = evaluation.created_by`;

const SAVE_EVALUATION = `
  WITH saved AS (
    INSERT INTO session_general_evaluations (session_id, text, created_by, updated_by)
    VALUES ($1, $2, $3, $3)
    ON CONFLICT (session_id, created_by) DO UPDATE
      SET text = EXCLUDED.text, updated_by = EXCLUDED.updated_by, updated_at = NOW()
    RETURNING *
  )
  SELECT saved.id, saved.session_id AS "sessionId", saved.text,
    saved.created_by AS "createdBy", saved.updated_by AS "updatedBy",
    saved.created_at AS "createdAt", saved.updated_at AS "updatedAt",
    saved.created_by AS "authorId", users.name AS "authorName"
  FROM saved JOIN users ON users.id = saved.created_by;`;

const DELETE_EVALUATION = `
  DELETE FROM session_general_evaluations
  WHERE session_id = $1 AND created_by = $2;`;

@Injectable()
export class PgSessionGeneralEvaluationRepository implements SessionGeneralEvaluationRepository {
  constructor(
    @InjectRepository(SessionGeneralEvaluation)
    private readonly evaluations: Repository<SessionGeneralEvaluation>,
  ) {}

  async findBySessionId(sessionId: string): Promise<SessionGeneralEvaluationRecord[]> {
    const rows = await this.evaluations.query<SessionGeneralEvaluationRow[]>(
      `${SELECT_EVALUATION} WHERE evaluation.session_id = $1 ORDER BY evaluation.created_at, evaluation.id;`,
      [sessionId],
    );
    return rows.map((row) => this.toRecord(row));
  }

  async save(
    sessionId: string,
    text: string,
    tutorId: string,
  ): Promise<SessionGeneralEvaluationRecord> {
    const rows = await this.evaluations.query<SessionGeneralEvaluationRow[]>(SAVE_EVALUATION, [
      sessionId,
      text,
      tutorId,
    ]);
    return this.toRecord(requireFirstRow(rows, 'Failed to save session general evaluation.'));
  }

  async deleteBySessionAndTutor(sessionId: string, tutorId: string): Promise<void> {
    await this.evaluations.query(DELETE_EVALUATION, [sessionId, tutorId]);
  }

  private toRecord(row: SessionGeneralEvaluationRow): SessionGeneralEvaluationRecord {
    return Object.assign(new SessionGeneralEvaluation(), row, {
      author: { id: row.authorId, name: row.authorName },
    });
  }
}
