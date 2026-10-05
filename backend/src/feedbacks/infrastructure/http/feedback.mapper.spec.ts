import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import {
  toFeedbackRevisionResponse,
  toGeneralFeedbackResponse,
  toProblemFeedbacksResponse,
  toSessionFeedbackResponse,
  toStudentProblemFeedbackResponse,
} from './feedback.mapper';

describe('Feedback Mapper', () => {
  it('maps student problem feedback correctly', () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 9.5,
      text: 'Parabéns.',
    });
    feedback.id = 'feedback-uuid';

    const result = toStudentProblemFeedbackResponse(feedback);

    expect(result).toEqual({
      id: 'feedback-uuid',
      escopo: 'ALUNO',
      destinatarioId: 'student-1',
      nota: 9.5,
      texto: 'Parabéns.',
      criadoEm: feedback.createdAt,
      editadoEm: null,
    });
  });

  it('maps general feedback correctly', () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Geral.',
    });
    feedback.id = 'feedback-uuid';

    const result = toGeneralFeedbackResponse(feedback);

    expect(result).toEqual({
      id: 'feedback-uuid',
      escopo: 'PROBLEMA',
      texto: 'Geral.',
      criadoEm: feedback.createdAt,
      editadoEm: null,
    });
  });

  it('maps session feedback correctly', () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Sessão ok.',
    });
    feedback.id = 'feedback-uuid';

    const result = toSessionFeedbackResponse(feedback);

    expect(result).toEqual({
      id: 'feedback-uuid',
      escopo: 'SESSAO',
      sessaoId: 'session-1',
      destinatarioId: 'student-1',
      texto: 'Sessão ok.',
      criadoEm: feedback.createdAt,
      editadoEm: null,
    });
  });

  it('maps problem feedbacks list correctly', () => {
    const general = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Geral.',
    });
    general.id = 'gen-id';

    const studentFeedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 8.0,
      text: 'Aluno 1.',
    });
    studentFeedback.id = 'st-id';

    const result = toProblemFeedbacksResponse(general, [
      { studentId: 'student-1', studentName: 'João', feedback: studentFeedback },
      { studentId: 'student-2', studentName: 'Maria', feedback: null },
    ]);

    expect(result.geral?.texto).toBe('Geral.');
    expect(result.alunos).toHaveLength(2);
    expect(result.alunos[0]?.alunoId).toBe('student-1');
    expect(result.alunos[0]?.nome).toBe('João');
    expect(result.alunos[0]?.feedback?.nota).toBe(8.0);
    expect(result.alunos[1]?.feedback).toBeNull();
  });

  it('maps feedback revision item correctly', () => {
    const now = new Date();
    const result = toFeedbackRevisionResponse({
      score: 7.5,
      text: 'Texto prévio.',
      editedBy: 'Carlos',
      editedAt: now,
    });

    expect(result).toEqual({
      nota: 7.5,
      texto: 'Texto prévio.',
      editadoPor: 'Carlos',
      editadoEm: now,
    });
  });
});
