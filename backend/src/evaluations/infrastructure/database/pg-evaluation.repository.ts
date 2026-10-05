import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  EvaluationRepository,
  EvaluationContext,
  EvaluationWrite,
  EvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { LIST_EVALUATIONS } from './evaluation.queries';
import { readProblemConfig } from './session-evaluation-config.persistence';
import { readEvaluationDetail } from './evaluation.reads';
import { recordEvaluation } from './evaluation.persistence';

interface SummaryRow extends Omit<EvaluationSummary, 'sessionScore'> {
  sessionScore: string | null;
}

@Injectable()
export class PgEvaluationRepository implements EvaluationRepository {
  constructor(private readonly dataSource: DataSource) {}

  getProblemCriteria(problemId: string) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      readProblemConfig(manager, problemId),
    );
  }

  async isEnrolled(roomId: string, studentId: string): Promise<boolean> {
    const [row] = await this.dataSource.query<{ exists: boolean }[]>(
      'SELECT EXISTS (SELECT 1 FROM room_students WHERE room_id = $1 AND student_id = $2) AS exists;',
      [roomId, studentId],
    );
    return row?.exists ?? false;
  }

  async list(context: EvaluationContext): Promise<EvaluationSummary[]> {
    const rows = await this.dataSource.query<SummaryRow[]>(LIST_EVALUATIONS, [
      context.roomId,
      context.sessionId,
    ]);
    return rows.map((row) => ({
      ...row,
      sessionScore: row.sessionScore === null ? null : Number(row.sessionScore),
    }));
  }

  get(context: EvaluationContext, studentId: string) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      readEvaluationDetail(manager, context, studentId),
    );
  }

  recordEvaluation(input: EvaluationWrite) {
    return this.dataSource.transaction((manager) => recordEvaluation(manager, input));
  }
}
