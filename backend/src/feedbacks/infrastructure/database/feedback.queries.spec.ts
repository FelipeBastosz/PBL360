import { Feedback } from '../../domain/entities/feedback.entity';
import {
  FEEDBACK_COLUMNS,
  FIND_FEEDBACK_BY_ID_QUERY,
  FIND_STUDENT_PROBLEM_FEEDBACK_QUERY,
  FIND_GENERAL_PROBLEM_FEEDBACK_QUERY,
  FIND_STUDENT_SESSION_FEEDBACK_QUERY,
  FIND_STUDENT_SESSION_FEEDBACK_READ_AT_QUERY,
  MARK_STUDENT_SESSION_FEEDBACK_READ_QUERY,
  FIND_REVISIONS_QUERY,
  CHECK_STUDENT_ENROLLED_QUERY,
  LIST_STUDENTS_FEEDBACK_QUERY,
  INSERT_FEEDBACK_QUERY,
  INSERT_FEEDBACK_REVISION_QUERY,
  UPDATE_FEEDBACK_QUERY,
  FIND_PROBLEM_FEEDBACKS_WITH_DETAILS_QUERY,
  toFeedbackParams,
  toRevisionParams,
} from './feedback.queries';
import type { FeedbackRevision } from '../../domain/entities/feedback-revision.entity';

describe('feedback SQL helpers', () => {
  it('exposes the feedback queries and maps persistence parameters', () => {
    const queries = [
      FEEDBACK_COLUMNS,
      FIND_FEEDBACK_BY_ID_QUERY,
      FIND_STUDENT_PROBLEM_FEEDBACK_QUERY,
      FIND_GENERAL_PROBLEM_FEEDBACK_QUERY,
      FIND_STUDENT_SESSION_FEEDBACK_QUERY,
      FIND_STUDENT_SESSION_FEEDBACK_READ_AT_QUERY,
      MARK_STUDENT_SESSION_FEEDBACK_READ_QUERY,
      FIND_REVISIONS_QUERY,
      CHECK_STUDENT_ENROLLED_QUERY,
      LIST_STUDENTS_FEEDBACK_QUERY,
      INSERT_FEEDBACK_QUERY,
      INSERT_FEEDBACK_REVISION_QUERY,
      UPDATE_FEEDBACK_QUERY,
      FIND_PROBLEM_FEEDBACKS_WITH_DETAILS_QUERY,
    ];
    expect(queries.every((query) => query.length > 0)).toBe(true);

    const feedback = Object.assign(new Feedback(), {
      authorId: 't1',
      problemId: 'p1',
      recipientId: 's1',
      sessionId: 'ss1',
      scope: 'ALUNO',
      score: 8,
      text: 'Feedback',
      createdAt: new Date('2025-01-01'),
      editedAt: null,
    });
    expect(toFeedbackParams(feedback)).toEqual([
      't1',
      'p1',
      's1',
      'ss1',
      'ALUNO',
      8,
      'Feedback',
      feedback.createdAt,
      null,
    ]);
    expect(
      toRevisionParams({
        feedbackId: 'f1',
        previousScore: 7,
        previousText: 'Anterior',
        editedBy: 't1',
        editedAt: feedback.createdAt,
        justification: undefined,
      } as FeedbackRevision),
    ).toEqual(['f1', 7, 'Anterior', 't1', feedback.createdAt, null]);
  });
});
