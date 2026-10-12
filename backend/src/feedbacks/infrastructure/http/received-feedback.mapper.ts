import type {
  ReceivedFeedback,
  ReceivedProblemFeedbacks,
} from '../../domain/repositories/received-feedback.repository';
import type { ReceivedFeedbackResponseDto } from '../../application/dtos/received-feedback-response.dto';
import type { ReceivedProblemFeedbacksResponseDto } from '../../application/dtos/received-problem-feedbacks-response.dto';

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
  };
}

export function toReceivedProblemResponse(
  result: ReceivedProblemFeedbacks,
): ReceivedProblemFeedbacksResponseDto {
  return {
    individual: result.individual
      ? { ...toReceivedFeedbackResponse(result.individual), nota: result.individual.score }
      : null,
    geral: result.general ? toReceivedFeedbackResponse(result.general) : null,
    sessoes: result.sessions.map((session) => ({
      sessaoId: session.sessionId,
      rotulo: session.label,
      data: session.date,
      feedback: session.feedback ? toReceivedFeedbackResponse(session.feedback) : null,
    })),
  };
}
