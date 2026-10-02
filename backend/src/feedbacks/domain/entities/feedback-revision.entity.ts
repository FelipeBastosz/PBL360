import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface CreateFeedbackRevisionProps {
  feedbackId: string;
  previousScore: number | null;
  previousText: string;
  editedBy: string;
}

@Entity('feedback_revisions')
export class FeedbackRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'feedback_id', type: 'uuid' })
  feedbackId: string;

  @Column({
    name: 'conteudo_anterior_nota',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  previousScore: number | null;

  @Column({ name: 'conteudo_anterior_texto', type: 'text' })
  previousText: string;

  @Column({ name: 'edited_by', type: 'uuid' })
  editedBy: string;

  @CreateDateColumn({ name: 'edited_at', type: 'timestamptz' })
  editedAt: Date;

  static create(props: CreateFeedbackRevisionProps): FeedbackRevision {
    const revision = new FeedbackRevision();
    revision.feedbackId = props.feedbackId;
    revision.previousScore = props.previousScore;
    revision.previousText = props.previousText;
    revision.editedBy = props.editedBy;
    revision.editedAt = new Date();
    return revision;
  }
}
