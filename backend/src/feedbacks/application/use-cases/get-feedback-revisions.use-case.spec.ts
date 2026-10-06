import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { GetFeedbackRevisionsUseCase } from './get-feedback-revisions.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { NotFoundError } from '@/shared/errors/application.error';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('GetFeedbackRevisionsUseCase', () => {
  let useCase: GetFeedbackRevisionsUseCase;
  let feedbackRepository: jest.Mocked<FeedbackRepository>;
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

    useCase = new GetFeedbackRevisionsUseCase(
      feedbackRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('returns revisions ordered for a feedback', async () => {
    const feedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 8.5,
      text: 'Texto atual.',
    });
    feedback.id = 'feedback-uuid';
    feedbackRepository.findById.mockResolvedValue(feedback);

    const revisions = [
      { score: 8.0, text: 'Texto rev 2', editedBy: 'Carlos', editedAt: new Date() },
      { score: 7.0, text: 'Texto rev 1', editedBy: 'Maria', editedAt: new Date(Date.now() - 1000) },
    ];
    feedbackRepository.findRevisionsByFeedbackId.mockResolvedValue(revisions);

    const result = await useCase.execute({
      feedbackId: 'feedback-uuid',
      tutorId: 'tutor-1',
    });

    expect(result).toBe(revisions);
  });

  it('rejects if feedback does not exist', async () => {
    feedbackRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        feedbackId: 'non-existing',
        tutorId: 'tutor-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
