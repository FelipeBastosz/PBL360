import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { SaveStudentProblemFeedbackUseCase } from './save-student-problem-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('SaveStudentProblemFeedbackUseCase', () => {
  let useCase: SaveStudentProblemFeedbackUseCase;
  let feedbackRepository: jest.Mocked<FeedbackRepository>;
  let problemRepository: jest.Mocked<ProblemRepository>;
  let roomAccessService: jest.Mocked<RoomAccessService>;

  beforeEach(() => {
    feedbackRepository = {
      findById: jest.fn(),
      findStudentProblemFeedback: jest.fn(),
      findGeneralProblemFeedback: jest.fn(),
      findStudentSessionFeedback: jest.fn(),
      findStudentSessionFeedbackReadAt: jest.fn(),
      markStudentSessionFeedbackRead: jest.fn(),
      saveWithRevision: jest.fn().mockImplementation((f) => Promise.resolve(f)),
      findRevisionsByFeedbackId: jest.fn(),
      isStudentEnrolledInRoom: jest.fn().mockResolvedValue(true),
      listStudentsWithProblemFeedbacks: jest.fn(),
      findProblemFeedbacksWithDetails: jest.fn(),
    };

    const mockProblem = new Problem();
    mockProblem.id = 'problem-1';
    mockProblem.roomId = 'room-1';

    problemRepository = {
      hasEvaluations: jest.fn(),
      updateDetails: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockProblem),
      findByRoomId: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      hasSessions: jest.fn(),
      countSessions: jest.fn(),
      getDeletionImpact: jest.fn(),
      delete: jest.fn(),
    };

    roomAccessService = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(new Room()),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new SaveStudentProblemFeedbackUseCase(
      feedbackRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('creates a new feedback when none exists without justification', async () => {
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(null);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
      score: 8.5,
      text: 'Participou muito bem.',
    });

    expect(result.scope).toBe(FeedbackScope.STUDENT);
    expect(result.score).toBe(8.5);
    expect(result.text).toBe('Participou muito bem.');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(expect.any(Feedback), null);
  });

  it('updates an existing feedback with grade adjustment when justification is valid', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 7.0,
      text: 'Texto anterior.',
    });
    existing.id = 'feedback-uuid';
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      tutorId: 'tutor-2',
      score: 9.0,
      text: 'Texto atualizado.',
      justification: 'Nota ajustada após revisão detalhada dos critérios.',
    });

    expect(result.score).toBe(9.0);
    expect(result.text).toBe('Texto atualizado.');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(
      existing,
      expect.objectContaining({
        feedbackId: 'feedback-uuid',
        previousScore: 7.0,
        previousText: 'Texto anterior.',
        editedBy: 'tutor-2',
        justification: 'Nota ajustada após revisão detalhada dos critérios.',
      }),
    );
  });

  it('allows updating text without changing grade when justification is omitted', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 7.0,
      text: 'Texto anterior.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      tutorId: 'tutor-2',
      score: 7.0,
      text: 'Novo texto apenas.',
    });

    expect(result.score).toBe(7.0);
    expect(result.text).toBe('Novo texto apenas.');
  });

  it('moves an existing problem feedback to the supplied session', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 7,
      text: 'Texto anterior.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      sessionId: 'session-1',
      tutorId: 'tutor-2',
      score: 7,
      text: 'Texto atualizado.',
    });

    expect(existing.sessionId).toBe('session-1');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(existing, expect.any(Object));
  });

  it('allows assigning score for the first time when previous score was null without justification', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: null,
      text: 'Feedback inicial sem nota.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      tutorId: 'tutor-2',
      score: 8.0,
      text: 'Agora atribuindo nota.',
    });

    expect(result.score).toBe(8.0);
  });

  it('rejects grade change with UnprocessableEntityError if justification is missing', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 6.0,
      text: 'Texto.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        score: 8.0,
        text: 'Nova nota sem justificativa.',
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('rejects grade change if justification is shorter than 10 characters', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 6.0,
      text: 'Texto.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        score: 8.0,
        text: 'Nova nota.',
        justification: 'Curto',
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('rejects grade change if justification exceeds 500 characters', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 6.0,
      text: 'Texto.',
    });
    feedbackRepository.findStudentProblemFeedback.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        score: 8.0,
        text: 'Nova nota.',
        justification: 'a'.repeat(501),
      }),
    ).rejects.toThrow('A justificativa deve ter no máximo 500 caracteres.');
  });

  it('rejects with UnprocessableEntityError if student is not enrolled', async () => {
    feedbackRepository.isStudentEnrolledInRoom.mockResolvedValue(false);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        score: 8.0,
        text: 'Feedback.',
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('rejects with NotFoundError if problem does not belong to the room', async () => {
    const otherProblem = new Problem();
    otherProblem.id = 'problem-1';
    otherProblem.roomId = 'other-room';
    problemRepository.findById.mockResolvedValue(otherProblem);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        score: 8.0,
        text: 'Feedback.',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('isolates feedback validation by sessionId without leaking existing score from another session', async () => {
    // When queried for session-2, return null (session 2 has no previous feedback)
    feedbackRepository.findStudentProblemFeedback.mockImplementation(
      (_probId, _studentId, sessionId) => {
        if (sessionId === 'session-2') return Promise.resolve(null);
        const s1Feedback = Feedback.create({
          authorId: 'tutor-1',
          problemId: 'problem-1',
          sessionId: 'session-1',
          recipientId: 'student-1',
          scope: FeedbackScope.STUDENT,
          score: 10.0,
          text: 'Feedback da Sessão 1.',
        });
        return Promise.resolve(s1Feedback);
      },
    );

    // Save for session-2 with score 9.0 (different from session-1's 10.0) without justification
    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      studentId: 'student-1',
      sessionId: 'session-2',
      tutorId: 'tutor-1',
      score: 9.0,
      text: 'Primeiro feedback da Sessão 2.',
    });

    expect(result.sessionId).toBe('session-2');
    expect(result.score).toBe(9.0);
    expect(result.text).toBe('Primeiro feedback da Sessão 2.');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-2', score: 9.0 }),
      null,
    );
  });
});
