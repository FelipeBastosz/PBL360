import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FeedbackScope } from '../enums/feedback-scope.enum';
import { FeedbackRevision } from './feedback-revision.entity';

export interface CreateFeedbackProps {
  authorId: string;
  problemId: string;
  recipientId?: string | null;
  sessionId?: string | null;
  scope: FeedbackScope;
  score?: number | null;
  text: string;
}

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'autor_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'problema_id', type: 'uuid' })
  problemId: string;

  @Column({ name: 'destinatario_id', type: 'uuid', nullable: true })
  recipientId: string | null;

  @Column({ name: 'sessao_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({ name: 'escopo', type: 'enum', enum: FeedbackScope })
  scope: FeedbackScope;

  @Column({ name: 'nota', type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ name: 'texto', type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'editado_em', type: 'timestamptz', nullable: true })
  editedAt: Date | null;

  static create(props: CreateFeedbackProps): Feedback {
    const feedback = new Feedback();
    feedback.authorId = props.authorId;
    feedback.problemId = props.problemId;
    feedback.recipientId = props.recipientId ?? null;
    feedback.sessionId = props.sessionId ?? null;
    feedback.scope = props.scope;
    feedback.score = props.score ?? null;
    feedback.text = props.text.trim();
    feedback.createdAt = new Date();
    feedback.editedAt = null;
    return feedback;
  }

  update(newScore: number | null, newText: string, editorId: string): FeedbackRevision {
    const revision = FeedbackRevision.create({
      feedbackId: this.id,
      previousScore: this.score,
      previousText: this.text,
      editedBy: editorId,
    });

    this.score = newScore;
    this.text = newText.trim();
    this.authorId = editorId;
    this.editedAt = new Date();

    return revision;
  }
}
