import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import {
  toFeedbackEntity,
  toProblemFeedbackDetail,
  type FeedbackRow,
  type ProblemFeedbackDetailRow,
} from './feedback-row.mapper';

describe('feedback row mappers', () => {
  const row: FeedbackRow = {
    id: 'f1',
    authorId: 't1',
    problemId: 'p1',
    recipientId: null,
    sessionId: 's1',
    scope: FeedbackScope.SESSION,
    score: '9.5',
    text: 'Bom trabalho',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    editedAt: null,
  };

  it('maps nullable score and missing justification to the entity defaults', () => {
    expect(toFeedbackEntity(row)).toBeInstanceOf(Feedback);
    expect(toFeedbackEntity(row)).toMatchObject({ score: 9.5, justification: null });
    expect(toFeedbackEntity({ ...row, score: null, justification: '  motivo  ' })).toMatchObject({
      score: null,
      justification: '  motivo  ',
    });
  });

  it('maps problem feedback details for both numeric and null scores', () => {
    const detail: ProblemFeedbackDetailRow = {
      id: 'f2',
      scope: FeedbackScope.PROBLEM,
      authorId: 't1',
      authorName: 'Tutor',
      recipientId: 'u1',
      recipientName: 'Aluno',
      sessionId: null,
      sessionTitle: null,
      score: 7,
      text: 'Feedback',
      createdAt: row.createdAt,
      editedAt: row.editedAt,
    };
    expect(toProblemFeedbackDetail(detail)).toMatchObject({ score: 7, recipientName: 'Aluno' });
    expect(toProblemFeedbackDetail({ ...detail, score: null }).score).toBeNull();
  });
});
