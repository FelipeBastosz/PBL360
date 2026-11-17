import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export interface CreateFeedbackTemplateProps {
  title: string;
  text: string;
}

@Entity('feedback_templates')
@Unique('uq_feedback_templates_title', ['title'])
export class FeedbackTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 2000 })
  text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  static create(props: CreateFeedbackTemplateProps): FeedbackTemplate {
    const template = new FeedbackTemplate();
    template.title = props.title.trim();
    template.text = props.text.trim();
    template.createdAt = new Date();
    template.updatedAt = template.createdAt;
    return template;
  }
}
