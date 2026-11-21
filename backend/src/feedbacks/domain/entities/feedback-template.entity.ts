import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { InvalidFeedbackTemplateError } from '../errors/invalid-feedback-template.error';

export { InvalidFeedbackTemplateError };

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
    template.title = props.title?.trim();
    template.text = props.text?.trim();

    template.assertIsValid();

    template.createdAt = new Date();
    template.updatedAt = template.createdAt;
    return template;
  }

  private assertIsValid(): void {
    if (!this.title) {
      throw new InvalidFeedbackTemplateError('O título do modelo de feedback é obrigatório.');
    }

    if (this.title.length > 120) {
      throw new InvalidFeedbackTemplateError(
        'O título do modelo de feedback deve ter no máximo 120 caracteres.',
      );
    }

    if (!this.text) {
      throw new InvalidFeedbackTemplateError('O texto do modelo de feedback é obrigatório.');
    }

    if (this.text.length > 2000) {
      throw new InvalidFeedbackTemplateError(
        'O texto do modelo de feedback deve ter no máximo 2000 caracteres.',
      );
    }
  }
}
