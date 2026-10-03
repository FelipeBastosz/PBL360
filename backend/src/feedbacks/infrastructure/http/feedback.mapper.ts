import type { Feedback } from '../../domain/entities/feedback.entity';
import type {
  FeedbackRevisionItem,
  FeedbackWithStudent,
} from '../../domain/repositories/feedback.repository';
import type { StudentProblemFeedbackResponseDto } from '../../application/dtos/student-problem-feedback-response.dto';
import type { GeneralFeedbackResponseDto } from '../../application/dtos/general-feedback-response.dto';
import type { SessionFeedbackResponseDto } from '../../application/dtos/session-feedback-response.dto';
import type {
  ProblemFeedbacksResponseDto,
  StudentWithFeedbackDto,
} from '../../application/dtos/problem-feedbacks-response.dto';
import type { FeedbackRevisionResponseDto } from '../../application/dtos/feedback-revision-response.dto';

export const toStudentProblemFeedbackResponse = (
  feedback: Feedback,
): StudentProblemFeedbackResponseDto => ({
  id: feedback.id,
  escopo: 'ALUNO',
  destinatarioId: feedback.recipientId as string,
  nota: feedback.score !== null && feedback.score !== undefined ? Number(feedback.score) : null,
  texto: feedback.text,
  criadoEm: feedback.createdAt,
  editadoEm: feedback.editedAt ?? null,
});

export const toGeneralFeedbackResponse = (feedback: Feedback): GeneralFeedbackResponseDto => ({
  id: feedback.id,
  escopo: 'PROBLEMA',
  texto: feedback.text,
  criadoEm: feedback.createdAt,
  editadoEm: feedback.editedAt ?? null,
});

export const toSessionFeedbackResponse = (feedback: Feedback): SessionFeedbackResponseDto => ({
  id: feedback.id,
  escopo: 'SESSAO',
  sessaoId: feedback.sessionId as string,
  destinatarioId: feedback.recipientId as string,
  texto: feedback.text,
  criadoEm: feedback.createdAt,
  editadoEm: feedback.editedAt ?? null,
});

export const toProblemFeedbacksResponse = (
  general: Feedback | null,
  students: FeedbackWithStudent[],
): ProblemFeedbacksResponseDto => ({
  geral: general ? toGeneralFeedbackResponse(general) : null,
  alunos: students.map(toStudentWithFeedback),
});

const toStudentWithFeedback = (student: FeedbackWithStudent): StudentWithFeedbackDto => ({
  alunoId: student.studentId,
  nome: student.studentName,
  feedback: student.feedback ? toStudentProblemFeedbackResponse(student.feedback) : null,
});

export const toFeedbackRevisionResponse = (
  item: FeedbackRevisionItem,
): FeedbackRevisionResponseDto => ({
  nota: item.score !== null && item.score !== undefined ? Number(item.score) : null,
  texto: item.text,
  editadoPor: item.editedBy,
  editadoEm: item.editedAt,
});
