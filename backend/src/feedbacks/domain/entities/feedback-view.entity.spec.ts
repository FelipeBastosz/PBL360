import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Feedback } from './feedback.entity';
import { FeedbackView } from './feedback-view.entity';

describe('FeedbackView', () => {
  it('stores the feedback, student and first-view timestamp', () => {
    const viewedAt = new Date('2025-01-01T00:00:00Z');
    const view = Object.assign(new FeedbackView(), {
      feedbackId: 'f1',
      studentId: 's1',
      firstViewedAt: viewedAt,
    });

    expect(view).toMatchObject({ feedbackId: 'f1', studentId: 's1', firstViewedAt: viewedAt });
  });

  it('maps the feedback and student relationships', () => {
    const targets = getMetadataArgsStorage()
      .relations.filter((relation) => relation.target === FeedbackView)
      .map((relation) =>
        typeof relation.type === 'function' ? (relation.type() as unknown) : relation.type,
      );

    expect(targets).toEqual([Feedback, User]);
  });
});
