import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { SessionRepository } from '@/sessions/domain/repositories/session.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { GetSessionFeedbackUseCase } from './get-session-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { Session } from '@/sessions/domain/entities/session.entity';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('GetSessionFeedbackUseCase', () => {
  let useCase: GetSessionFeedbackUseCase;
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
      saveWithRevision: jest.fn(),
      findRevisionsByFeedbackId: jest.fn(),
      isStudentEnrolledInRoom: jest.fn(),
      listStudentsWithProblemFeedbacks: jest.fn(),
    };

    const mockSession = new Session();
    mockSession.id = 'session-1';
    mockSession.problemId = 'problem-1';

    sessionRepository = {
      findById: jest.fn().mockResolvedValue(mockSession),
      findByProblemId: jest.fn(),
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
      delete: jest.fn(),
    };

    roomAccessService = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(new Room()),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new GetSessionFeedbackUseCase(
      feedbackRepository,
      sessionRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('returns the session feedback when found', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      sessionId: 'session-1',
      recipientId: 'student-1',
      scope: FeedbackScope.SESSION,
      text: 'Participou ativamente.',
    });
    feedbackRepository.findStudentSessionFeedback.mockResolvedValue(feedback);

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
    });

    expect(result).toBe(feedback);
  });

  it('returns null when no feedback found for the session', async () => {
    feedbackRepository.findStudentSessionFeedback.mockResolvedValue(null);

    const result = await useCase.execute({
      sessionId: 'session-1',
      studentId: 'student-1',
      tutorId: 'tutor-1',
    });

    expect(result).toBeNull();
  });
});
