import { Feedback } from './feedback.entity';
import { FeedbackScope } from '../enums/feedback-scope.enum';

describe('Feedback Entity', () => {
  it('creates a new student problem feedback', () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 9.5,
      text: 'Muito bom desempenho.',
    });

    expect(feedback.authorId).toBe('tutor-1');
    expect(feedback.problemId).toBe('problem-1');
    expect(feedback.recipientId).toBe('student-1');
    expect(feedback.scope).toBe(FeedbackScope.STUDENT);
    expect(feedback.score).toBe(9.5);
    expect(feedback.text).toBe('Muito bom desempenho.');
    expect(feedback.createdAt).toBeInstanceOf(Date);
    expect(feedback.editedAt).toBeNull();
  });

  it('updates a feedback and generates a revision with the previous state', () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 8.0,
      text: 'Texto inicial.',
    });
    feedback.id = 'feedback-uuid';

    const revision = feedback.update(9.0, 'Texto alterado.', 'tutor-2');

    expect(revision.feedbackId).toBe('feedback-uuid');
    expect(revision.previousScore).toBe(8.0);
    expect(revision.previousText).toBe('Texto inicial.');
    expect(revision.editedBy).toBe('tutor-2');
    expect(revision.editedAt).toBeInstanceOf(Date);

    expect(feedback.score).toBe(9.0);
    expect(feedback.text).toBe('Texto alterado.');
    expect(feedback.authorId).toBe('tutor-2');
    expect(feedback.editedAt).toBeInstanceOf(Date);
  });
});
