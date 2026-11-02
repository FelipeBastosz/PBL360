import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { GetProblemFeedbacksUseCase } from './get-problem-feedbacks.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('GetProblemFeedbacksUseCase', () => {
  let useCase: GetProblemFeedbacksUseCase;
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
      getDeletionImpact: jest.fn(),
      delete: jest.fn(),
    };

    roomAccessService = {
      assertTutorCanAccessRoom: jest.fn().mockResolvedValue(new Room()),
      assertTutorIsRoomOwner: jest.fn(),
    } as unknown as jest.Mocked<RoomAccessService>;

    useCase = new GetProblemFeedbacksUseCase(
      feedbackRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('returns general and students feedbacks for the problem', async () => {
    const general = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Geral.',
    });
    feedbackRepository.findGeneralProblemFeedback.mockResolvedValue(general);

    const studentFeedback = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      recipientId: 'student-1',
      scope: FeedbackScope.STUDENT,
      score: 9.0,
      text: 'Individual.',
    });

    feedbackRepository.listStudentsWithProblemFeedbacks.mockResolvedValue([
      { studentId: 'student-1', studentName: 'Aluno 1', feedback: studentFeedback },
      { studentId: 'student-2', studentName: 'Aluno 2', feedback: null },
    ]);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
    });

    expect(result.general).toBe(general);
    expect(result.students).toHaveLength(2);
    expect(result.students[0]?.feedback).toBe(studentFeedback);
    expect(result.students[1]?.feedback).toBeNull();
  });
});
