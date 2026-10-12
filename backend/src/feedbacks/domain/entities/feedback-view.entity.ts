import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { Feedback } from './feedback.entity';

@Entity('feedback_views')
export class FeedbackView {
  @PrimaryColumn({
    name: 'feedback_id',
    type: 'uuid',
    primaryKeyConstraintName: 'pk_feedback_views',
  })
  feedbackId: string;

  @PrimaryColumn({
    name: 'student_id',
    type: 'uuid',
    primaryKeyConstraintName: 'pk_feedback_views',
  })
  studentId: string;

  @CreateDateColumn({ name: 'first_viewed_at', type: 'timestamptz' })
  firstViewedAt: Date;

  @ManyToOne(() => Feedback, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'feedback_id', foreignKeyConstraintName: 'fk_feedback_views_feedback' })
  feedback?: Feedback;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id', foreignKeyConstraintName: 'fk_feedback_views_student' })
  student?: User;
}
