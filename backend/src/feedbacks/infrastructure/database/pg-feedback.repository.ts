import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { firstRowOrNull, requireFirstRow } from '@/shared/database/rows';
import { Feedback } from '../../domain/entities/feedback.entity';
import type { FeedbackRevision } from '../../domain/entities/feedback-revision.entity';
import type {
  FeedbackRepository,
  FeedbackRevisionItem,
  FeedbackWithStudent,
  ProblemFeedbackDetail,
} from '../../domain/repositories/feedback.repository';
import {
  CHECK_STUDENT_ENROLLED_QUERY,
  FIND_FEEDBACK_BY_ID_QUERY,
  FIND_GENERAL_PROBLEM_FEEDBACK_QUERY,
  FIND_PROBLEM_FEEDBACKS_WITH_DETAILS_QUERY,
  FIND_REVISIONS_QUERY,
  FIND_STUDENT_PROBLEM_FEEDBACK_QUERY,
  FIND_STUDENT_SESSION_FEEDBACK_QUERY,
  FIND_STUDENT_SESSION_FEEDBACK_READ_AT_QUERY,
  INSERT_FEEDBACK_QUERY,
  INSERT_FEEDBACK_REVISION_QUERY,
  LIST_STUDENTS_FEEDBACK_QUERY,
  MARK_STUDENT_SESSION_FEEDBACK_READ_QUERY,
  toFeedbackParams,
  toRevisionParams,
  UPDATE_FEEDBACK_QUERY,
} from './feedback.queries';
import {
  toFeedbackEntity,
  toProblemFeedbackDetail,
  type FeedbackRow,
  type ProblemFeedbackDetailRow,
  type StudentFeedbackRow,
} from './feedback-row.mapper';

@Injectable()
export class PgFeedbackRepository implements FeedbackRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<Feedback | null> {
    const rows = await this.dataSource.query<FeedbackRow[]>(FIND_FEEDBACK_BY_ID_QUERY, [id]);
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }

  async findStudentProblemFeedback(problemId: string, studentId: string): Promise<Feedback | null> {
    const rows = await this.dataSource.query<FeedbackRow[]>(FIND_STUDENT_PROBLEM_FEEDBACK_QUERY, [
      problemId,
      studentId,
    ]);
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }

  async findGeneralProblemFeedback(problemId: string): Promise<Feedback | null> {
    const rows = await this.dataSource.query<FeedbackRow[]>(FIND_GENERAL_PROBLEM_FEEDBACK_QUERY, [
      problemId,
    ]);
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }

  async findStudentSessionFeedback(sessionId: string, studentId: string): Promise<Feedback | null> {
    const rows = await this.dataSource.query<FeedbackRow[]>(FIND_STUDENT_SESSION_FEEDBACK_QUERY, [
      sessionId,
      studentId,
    ]);
    const row = firstRowOrNull(rows);
    return row ? this.toEntity(row) : null;
  }

  async findStudentSessionFeedbackReadAt(
    feedbackId: string,
    studentId: string,
  ): Promise<Date | null> {
    const rows = await this.dataSource.query<Array<{ readAt: Date }>>(
      FIND_STUDENT_SESSION_FEEDBACK_READ_AT_QUERY,
      [feedbackId, studentId],
    );
    return firstRowOrNull(rows)?.readAt ?? null;
  }

  async markStudentSessionFeedbackRead(
    feedbackId: string,
    studentId: string,
    readAt: Date,
  ): Promise<void> {
    await this.dataSource.query(MARK_STUDENT_SESSION_FEEDBACK_READ_QUERY, [
      feedbackId,
      studentId,
      readAt,
    ]);
  }

  async isStudentEnrolledInRoom(roomId: string, studentId: string): Promise<boolean> {
    const rows = await this.dataSource.query<{ '?column?': number }[]>(
      CHECK_STUDENT_ENROLLED_QUERY,
      [roomId, studentId],
    );
    return rows.length > 0;
  }

  async findRevisionsByFeedbackId(feedbackId: string): Promise<FeedbackRevisionItem[]> {
    const rows = await this.dataSource.query<
      { score: string | number | null; text: string; editedBy: string; editedAt: Date }[]
    >(FIND_REVISIONS_QUERY, [feedbackId]);

    return rows.map((row) => ({
      score: row.score !== null ? Number(row.score) : null,
      text: row.text,
      editedBy: row.editedBy,
      editedAt: row.editedAt,
    }));
  }

  async listStudentsWithProblemFeedbacks(
    roomId: string,
    problemId: string,
  ): Promise<FeedbackWithStudent[]> {
    const rows = await this.dataSource.query<StudentFeedbackRow[]>(LIST_STUDENTS_FEEDBACK_QUERY, [
      roomId,
      problemId,
    ]);

    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName,
      feedback: row.feedbackId ? this.toEntity({ ...row, id: row.feedbackId }) : null,
    }));
  }

  async saveWithRevision(feedback: Feedback, revision: FeedbackRevision | null): Promise<Feedback> {
    if (!revision) {
      return this.insertFeedback(feedback);
    }
    await this.updateFeedbackWithRevision(feedback, revision);
    return feedback;
  }

  private async insertFeedback(feedback: Feedback): Promise<Feedback> {
    const rows = await this.dataSource.query<FeedbackRow[]>(
      INSERT_FEEDBACK_QUERY,
      toFeedbackParams(feedback),
    );
    return this.toEntity(requireFirstRow(rows, 'Failed to insert feedback.'));
  }

  private async updateFeedbackWithRevision(
    feedback: Feedback,
    revision: FeedbackRevision,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(INSERT_FEEDBACK_REVISION_QUERY, toRevisionParams(revision));
      await manager.query(UPDATE_FEEDBACK_QUERY, [
        feedback.id,
        feedback.authorId,
        feedback.score,
        feedback.text,
        feedback.editedAt,
      ]);
    });
  }

  async findProblemFeedbacksWithDetails(problemId: string): Promise<ProblemFeedbackDetail[]> {
    const rows = await this.dataSource.query<ProblemFeedbackDetailRow[]>(
      FIND_PROBLEM_FEEDBACKS_WITH_DETAILS_QUERY,
      [problemId],
    );
    return rows.map(toProblemFeedbackDetail);
  }

  private toEntity(row: FeedbackRow): Feedback {
    return toFeedbackEntity(row);
  }
}
