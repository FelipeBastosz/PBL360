import type { FeedbackTemplate } from '../entities/feedback-template.entity';

export const FEEDBACK_TEMPLATE_REPOSITORY = Symbol('FEEDBACK_TEMPLATE_REPOSITORY');

export interface FeedbackTemplateRepository {
  findAll(): Promise<FeedbackTemplate[]>;
}
