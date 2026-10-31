import type {
  ReceivedFeedback,
  ReceivedProblemFeedbacks,
} from '../../domain/repositories/received-feedback.repository';
import type { ReceivedFeedbackResponseDto } from '../../application/dtos/received-feedback-response.dto';
import type {
  AssociatedFeedbackResponseDto,
  ReceivedProblemFeedbacksResponseDto,
} from '../../application/dtos/received-problem-feedbacks-response.dto';
import { toBrazilianDate } from '@/shared/dates/brazilian-date';

export function toReceivedFeedbackResponse(
  feedback: ReceivedFeedback,
): ReceivedFeedbackResponseDto {
  return {
    id: feedback.id,
    autor: { id: feedback.author.id, nome: feedback.author.name },
    texto: feedback.text,
    criadoEm: feedback.createdAt,
    editadoEm: feedback.editedAt,
    novo: feedback.isNew,
    nota: feedback.score,
  };
}

export function toReceivedProblemResponse(
  result: ReceivedProblemFeedbacks,
): ReceivedProblemFeedbacksResponseDto {
  return {
    notaFinal: result.finalScore,
    feedbacks: toAssociatedFeedbacks(result),
    individual: result.individual
      ? { ...toReceivedFeedbackResponse(result.individual), nota: result.individual.score }
      : null,
    geral: result.general ? toReceivedFeedbackResponse(result.general) : null,
    sessoes: result.sessions.map((session) => ({
      sessaoId: session.sessionId,
      rotulo: session.label,
      data: toBrazilianDate(session.date)!,
      feedback: session.feedback ? toReceivedFeedbackResponse(session.feedback) : null,
    })),
  };
}

function toAssociatedFeedbacks(result: ReceivedProblemFeedbacks): AssociatedFeedbackResponseDto[] {
  const feedbacks: AssociatedFeedbackResponseDto[] = [];
  if (result.individual)
    feedbacks.push({ ...toReceivedFeedbackResponse(result.individual), tipo: 'INDIVIDUAL' });
  if (result.general)
    feedbacks.push({ ...toReceivedFeedbackResponse(result.general), tipo: 'GERAL' });
  for (const session of result.sessions) {
    if (session.feedback)
      feedbacks.push({
        ...toReceivedFeedbackResponse(session.feedback),
        tipo: 'SESSAO',
        sessaoId: session.sessionId,
      });
  }
  return feedbacks;
}
