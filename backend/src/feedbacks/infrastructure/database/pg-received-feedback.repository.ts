import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { readReceivedFeedbackGrades } from './received-feedback-grades.reads';
import type {
  ReceivedFeedbackRepository,
  ReceivedProblemFeedbacks,
} from '../../domain/repositories/received-feedback.repository';
import {
  INSERT_FIRST_VIEWS,
  MARK_SESSION_FEEDBACKS_READ,
  READ_PROBLEM_FEEDBACKS,
  READ_PROBLEM_SESSIONS,
  READ_SESSION_FEEDBACK,
} from './received-feedback.queries';
import {
  type ReceivedFeedbackRow,
  type ReceivedSessionRow,
  toReceivedFeedback,
  toReceivedProblem,
} from './received-feedback-row.mapper';

@Injectable()
export class PgReceivedFeedbackRepository implements ReceivedFeedbackRepository {
  constructor(private readonly dataSource: DataSource) {}

  readSession(sessionId: string, studentId: string) {
    return this.dataSource.transaction(async (manager) => {
      const [row] = await manager.query<ReceivedFeedbackRow[]>(READ_SESSION_FEEDBACK, [
        sessionId,
        studentId,
      ]);
      if (!row) return null;
      const { roomId, problemId } = row;
      const grades = await readReceivedFeedbackGrades(manager, roomId, problemId, studentId);
      const newlyRead = await this.recordViews(manager, [row.id], studentId);
      const score = grades.sessions.get(sessionId) ?? null;
      return toReceivedFeedback(row, newlyRead, score, grades.components?.get(sessionId));
    });
  }

  readProblem(problemId: string, studentId: string, roomId: string) {
    return this.dataSource.transaction(async (manager) => {
      const sessions = await manager.query<ReceivedSessionRow[]>(READ_PROBLEM_SESSIONS, [
        problemId,
      ]);
      const rows = await manager.query<ReceivedFeedbackRow[]>(READ_PROBLEM_FEEDBACKS, [
        problemId,
        studentId,
      ]);
      const grades = await readReceivedFeedbackGrades(manager, roomId, problemId, studentId);
      const result = toReceivedProblem(rows, sessions, new Set(), grades);
      return this.recordProblemViews(manager, result, studentId);
    });
  }

  private async recordProblemViews(
    manager: EntityManager,
    result: ReceivedProblemFeedbacks,
    studentId: string,
  ): Promise<ReceivedProblemFeedbacks> {
    const visible = [result.general, ...result.sessions.map((item) => item.feedback)];
    const ids = visible.flatMap((feedback) => (feedback ? [feedback.id] : []));
    const newlyRead = await this.recordViews(manager, ids, studentId);
    for (const feedback of visible) {
      if (feedback) feedback.isNew = newlyRead.has(feedback.id);
    }
    return result;
  }

  private async recordViews(
    manager: EntityManager,
    ids: string[],
    studentId: string,
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const inserted = await manager.query<{ id: string }[]>(INSERT_FIRST_VIEWS, [ids, studentId]);
    await manager.query(MARK_SESSION_FEEDBACKS_READ, [ids, studentId]);
    return new Set(inserted.map((row) => row.id));
  }
}
