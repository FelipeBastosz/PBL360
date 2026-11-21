import { Inject, Injectable } from '@nestjs/common';
import type { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';
import {
  FEEDBACK_TEMPLATE_REPOSITORY,
  type FeedbackTemplateRepository,
} from '../../domain/repositories/feedback-template.repository';

@Injectable()
export class ListFeedbackTemplatesUseCase {
  constructor(
    @Inject(FEEDBACK_TEMPLATE_REPOSITORY)
    private readonly templates: FeedbackTemplateRepository,
  ) {}

  execute(): Promise<FeedbackTemplate[]> {
    return this.templates.findAll();
  }
}
