import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  isStudentParticipating,
  listSessionPeers,
  getPeerEvaluation,
} from './peer-evaluation.reads';
import { recordPeerEvaluation } from './peer-evaluation.persistence';
import type {
  EvaluationRepository,
  EvaluationContext,
  EvaluationWrite,
  EvaluationSummary,
  PeerEvaluationDetail,
  PeerEvaluationSummary,
  PeerEvaluationWrite,
  SelfAssessmentWrite,
  StudentEvaluationSummary,
} from '../../domain/repositories/evaluation.repository';
import { LIST_EVALUATIONS } from './evaluation.queries';
import { readProblemConfig } from './session-evaluation-config.persistence';
import { readEvaluationDetail } from './evaluation.reads';
import { recordEvaluation } from './evaluation.persistence';
import { getStudentEvaluationSummary } from './self-assessment.reads';
import { readSelfAssessmentDetail } from './self-assessment.reads';
import { recordSelfAssessment } from './self-assessment.persistence';

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

  isStudentParticipating(sessionId: string, studentId: string): Promise<boolean> {
    return isStudentParticipating(this.dataSource.manager, sessionId, studentId);
  }

  listSessionPeers(sessionId: string, evaluatorId: string): Promise<PeerEvaluationSummary[]> {
    return listSessionPeers(this.dataSource.manager, sessionId, evaluatorId);
  }

  getPeerEvaluation(
    context: EvaluationContext,
    evaluatorId: string,
    peerId: string,
  ): Promise<PeerEvaluationDetail> {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      getPeerEvaluation(manager, context, evaluatorId, peerId),
    );
  }

  recordPeerEvaluation(input: PeerEvaluationWrite): Promise<PeerEvaluationDetail> {
    return recordPeerEvaluation(this.dataSource.manager, input);
  }

  getSelfAssessment(context: EvaluationContext, studentId: string) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      readSelfAssessmentDetail(manager, context, studentId),
    );
  }

  getStudentEvaluationSummary(
    context: EvaluationContext,
    studentId: string,
  ): Promise<StudentEvaluationSummary> {
    return getStudentEvaluationSummary(this.dataSource.manager, context.sessionId, studentId);
  }

  recordSelfAssessment(input: SelfAssessmentWrite) {
    return recordSelfAssessment(this.dataSource.manager, input);
  }
}
