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
      saveWithRevision: jest.fn().mockImplementation((f) => Promise.resolve(f)),
      findRevisionsByFeedbackId: jest.fn(),
      isStudentEnrolledInRoom: jest.fn().mockResolvedValue(true),
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

    useCase = new SaveStudentProblemFeedbackUseCase(
      feedbackRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('creates a new feedback when none exists', async () => {
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
    expect(result.authorId).toBe('tutor-1');
    expect(result.recipientId).toBe('student-1');
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(expect.any(Feedback), null);
  });

  it('updates an existing feedback and saves a revision with the previous state', async () => {
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
    });

    expect(result.score).toBe(9.0);
    expect(result.text).toBe('Texto atualizado.');
    expect(result.authorId).toBe('tutor-2');
    expect(result.editedAt).toBeInstanceOf(Date);

    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(
      existing,
      expect.objectContaining({
        feedbackId: 'feedback-uuid',
        previousScore: 7.0,
        previousText: 'Texto anterior.',
        editedBy: 'tutor-2',
      }),
    );
  });

  it('rejects with UnprocessableEntityError (422) if student is not enrolled in the room', async () => {
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

    expect(feedbackRepository.saveWithRevision).not.toHaveBeenCalled();
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
});
