import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { PgFeedbackRepository } from './pg-feedback.repository';

describe('PgFeedbackRepository', () => {
  const feedbackRow = {
    id: 'feedback-1',
    authorId: 'teacher-1',
    problemId: 'problem-1',
    recipientId: 'student-1',
    sessionId: null,
    scope: FeedbackScope.STUDENT,
    score: '8.5',
    text: 'Bom trabalho',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    editedAt: null,
  };

  it('maps a feedback row and handles missing feedback', async () => {
    const query = jest.fn().mockResolvedValueOnce([feedbackRow]).mockResolvedValueOnce([]);
    const repository = new PgFeedbackRepository({ query } as never);

    const found = await repository.findById('feedback-1');
    expect(found).toBeInstanceOf(Feedback);
    expect(found).toMatchObject({ ...feedbackRow, score: 8.5, justification: null });
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('passes optional session ids as null and maps feedback lookups', async () => {
    const query = jest.fn().mockResolvedValue([feedbackRow]);
    const repository = new PgFeedbackRepository({ query } as never);

    await expect(
      repository.findStudentProblemFeedback('problem-1', 'student-1'),
    ).resolves.toMatchObject({
      score: 8.5,
    });
    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), ['problem-1', 'student-1', null]);
    await repository.findStudentProblemFeedback('problem-1', 'student-1', 'session-1');
    expect(query).toHaveBeenNthCalledWith(2, expect.any(String), [
      'problem-1',
      'student-1',
      'session-1',
    ]);
    await repository.findGeneralProblemFeedback('problem-1');
    await repository.findStudentSessionFeedback('session-1', 'student-1');
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('reads and updates session-feedback read timestamps', async () => {
    const readAt = new Date('2026-01-02T10:00:00Z');
    const query = jest.fn().mockResolvedValueOnce([{ readAt }]).mockResolvedValueOnce([]);
    const repository = new PgFeedbackRepository({ query } as never);

    await expect(
      repository.findStudentSessionFeedbackReadAt('feedback-1', 'student-1'),
    ).resolves.toBe(readAt);
    await expect(
      repository.findStudentSessionFeedbackReadAt('feedback-2', 'student-1'),
    ).resolves.toBeNull();
    await repository.markStudentSessionFeedbackRead('feedback-1', 'student-1', readAt);
    expect(query).toHaveBeenNthCalledWith(3, expect.any(String), [
      'feedback-1',
      'student-1',
      readAt,
    ]);
  });

  it('maps revisions, enrollment, student feedbacks, and detailed feedbacks', async () => {
    const date = new Date('2026-01-03T10:00:00Z');
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        { score: '7.25', text: 'Versão anterior', editedBy: 'Docente', editedAt: date },
        {
          score: null,
          text: 'Sem nota',
          editedBy: 'Professor',
          editedAt: date,
          justification: null,
        },
      ])
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockResolvedValueOnce([
        {
          studentId: 'student-1',
          studentName: 'Ana',
          feedbackId: 'feedback-1',
          ...feedbackRow,
        },
        { studentId: 'student-2', studentName: 'Bia', feedbackId: null },
      ])
      .mockResolvedValueOnce([
        {
          id: 'feedback-1',
          scope: FeedbackScope.STUDENT,
          authorId: 'teacher-1',
          authorName: 'Docente',
          recipientId: 'student-1',
          recipientName: 'Ana',
          sessionId: null,
          sessionTitle: null,
          score: '9',
          text: 'Ótimo',
          createdAt: date,
          editedAt: null,
        },
      ]);
    const repository = new PgFeedbackRepository({ query } as never);

    await expect(repository.findRevisionsByFeedbackId('feedback-1')).resolves.toEqual([
      {
        score: 7.25,
        text: 'Versão anterior',
        editedBy: 'Docente',
        editedAt: date,
        justification: null,
      },
      { score: null, text: 'Sem nota', editedBy: 'Professor', editedAt: date, justification: null },
    ]);
    await expect(repository.isStudentEnrolledInRoom('room-1', 'student-1')).resolves.toBe(true);
    await expect(
      repository.listStudentsWithProblemFeedbacks('room-1', 'problem-1'),
    ).resolves.toMatchObject([
      { studentId: 'student-1', feedback: { id: 'feedback-1', score: 8.5 } },
      { studentId: 'student-2', feedback: null },
    ]);
    await expect(repository.findProblemFeedbacksWithDetails('problem-1')).resolves.toMatchObject([
      { id: 'feedback-1', score: 9, authorName: 'Docente' },
    ]);
  });

  it('inserts new feedback and returns the persisted entity', async () => {
    const query = jest.fn().mockResolvedValue([feedbackRow]);
    const repository = new PgFeedbackRepository({ query } as never);
    const feedback = Feedback.create({
      authorId: 'teacher-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 8.5,
      text: 'Bom trabalho',
    });

    await expect(repository.saveWithRevision(feedback, null)).resolves.toMatchObject({
      id: 'feedback-1',
      score: 8.5,
    });
    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [
      feedback.authorId,
      feedback.problemId,
      feedback.recipientId,
      null,
      FeedbackScope.STUDENT,
      8.5,
      feedback.text,
      feedback.createdAt,
      null,
    ]);
  });

  it('persists a revision and updated feedback in one transaction', async () => {
    const managerQuery = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn((work: (manager: { query: jest.Mock }) => unknown) =>
      work({ query: managerQuery }),
    );
    const repository = new PgFeedbackRepository({ transaction } as never);
    const feedback = Feedback.create({
      authorId: 'teacher-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 8,
      text: 'Atualizado',
    });
    feedback.id = 'feedback-1';
    const revision = feedback.update(9, 'Atualizado', 'teacher-2', 'Revisão justificada');

    await expect(repository.saveWithRevision(feedback, revision)).resolves.toBe(feedback);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(managerQuery).toHaveBeenCalledTimes(2);
    expect(managerQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
      revision.feedbackId,
      revision.previousScore,
      revision.previousText,
      revision.editedBy,
      revision.editedAt,
      revision.justification,
    ]);
    expect(managerQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
      feedback.id,
      feedback.authorId,
      feedback.score,
      feedback.text,
      feedback.editedAt,
      null,
    ]);
  });

  it('throws when the insert does not return a row', async () => {
    const repository = new PgFeedbackRepository({
      query: jest.fn().mockResolvedValue([]),
    } as never);
    const feedback = Feedback.create({
      authorId: 'teacher-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Geral',
    });

    await expect(repository.saveWithRevision(feedback, null)).rejects.toThrow(
      'Failed to insert feedback.',
    );
  });
});
