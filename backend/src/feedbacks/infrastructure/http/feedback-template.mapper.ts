import type { FeedbackTemplateResponseDto } from '../../application/dtos/feedback-template-response.dto';
import type { FeedbackTemplate } from '../../domain/entities/feedback-template.entity';

export function toFeedbackTemplateResponse(
  template: FeedbackTemplate,
): FeedbackTemplateResponseDto {
  return {
    id: template.id,
    titulo: template.title,
    texto: template.text,
  };
}
