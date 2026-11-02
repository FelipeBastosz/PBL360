import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { SessionRepository } from '@/sessions/domain/repositories/session.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { SaveSessionFeedbackUseCase } from './save-session-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { Session } from '@/sessions/domain/entities/session.entity';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('SaveSessionFeedbackUseCase', () => {
  let useCase: SaveSessionFeedbackUseCase;
  let feedbackRepository: jest.Mocked<FeedbackRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let problemRepository: jest.Mocked<ProblemRepository>;
  let roomAccessService: jest.Mocked<RoomAccessService>;

  beforeEach(() => {
    feedbackRepository = {
      findById: jest.fn(),
      findStudentProblemFeedback: jest.fn(),
      findGeneralProblemFeedback: jest.fn(),
      findStudentSessionFeedback: jest.fn(),
      saveWithRevision: jest.fn().mockImplementation((f) => Promise.resolve(f)),
      findRevisionsByFeedbackId: jest.fn(),
      isStudentEnrolledInRoom: jest.fn().mockResolvedValue(true),
      listStudentsWithProblemFeedbacks: jest.fn(),
    };

    const mockSession = new Session();
    mockSession.id = 'session-1';
    mockSession.problemId = 'problem-1';

    sessionRepository = {
      findById: jest.fn().mockResolvedValue(mockSession),
      findByProblemId: jest.fn(),
      countReleaseSubmissions: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      getDeletionImpact: jest.fn(),
      delete: jest.fn(),
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

    useCase = new SaveSessionFeedbackUseCase(
      feedbackRepository,
      sessionRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('creates a new session feedback when none exists', async () => {
    feedbackRepository.findStudentSessionFeedback.mockResolvedValue(null);

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
      text: 'Boa participação na sessão.',
    });

    expect(result.scope).toBe(FeedbackScope.SESSION);
    expect(result.sessionId).toBe('session-1');
    expect(result.recipientId).toBe('student-1');
    expect(result.text).toBe('Boa participação na sessão.');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(expect.any(Feedback), null);
  });

  it('updates existing session feedback and generates revision', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Texto anterior.',
    });
    existing.id = 'feedback-uuid';
    feedbackRepository.findStudentSessionFeedback.mockResolvedValue(existing);

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-2',
      text: 'Texto atualizado.',
    });

    expect(result.text).toBe('Texto atualizado.');
    expect(result.editedAt).toBeInstanceOf(Date);
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(
      existing,
      expect.objectContaining({
        feedbackId: 'feedback-uuid',
        previousText: 'Texto anterior.',
        editedBy: 'tutor-2',
      }),
    );
  });

  it('rejects with UnprocessableEntityError (422) if student is not enrolled in the room', async () => {
    feedbackRepository.isStudentEnrolledInRoom.mockResolvedValue(false);

    await expect(
      useCase.execute({
        sessionId: 'session-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        text: 'Texto.',
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('rejects with NotFoundError if session does not exist', async () => {
    sessionRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        sessionId: 'session-1',
        studentId: 'student-1',
        tutorId: 'tutor-1',
        text: 'Texto.',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
