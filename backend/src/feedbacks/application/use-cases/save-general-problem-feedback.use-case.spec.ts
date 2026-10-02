import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { FeedbackRepository } from '../../domain/repositories/feedback.repository';
import { SaveGeneralProblemFeedbackUseCase } from './save-general-problem-feedback.use-case';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import { NotFoundError } from '@/shared/errors/application.error';
import { Problem } from '@/problems/domain/entities/problem.entity';
import { Room } from '@/rooms/domain/entities/room.entity';

describe('SaveGeneralProblemFeedbackUseCase', () => {
  let useCase: SaveGeneralProblemFeedbackUseCase;
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
      isStudentEnrolledInRoom: jest.fn(),
      listStudentsWithProblemFeedbacks: jest.fn(),
    };

    const mockProblem = new Problem();
    mockProblem.id = 'problem-1';
    mockProblem.roomId = 'room-1';

    problemRepository = {
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

    useCase = new SaveGeneralProblemFeedbackUseCase(
      feedbackRepository,
      problemRepository,
      roomAccessService,
    );
  });

  it('creates a new general feedback when none exists', async () => {
    feedbackRepository.findGeneralProblemFeedback.mockResolvedValue(null);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
      tutorId: 'tutor-1',
      text: 'Turma engajada.',
    });

    expect(result.scope).toBe(FeedbackScope.PROBLEM);
    expect(result.text).toBe('Turma engajada.');
    expect(result.recipientId).toBeNull();
    expect(feedbackRepository.saveWithRevision).toHaveBeenCalledWith(expect.any(Feedback), null);
  });

  it('updates an existing general feedback and generates revision', async () => {
    const existing = Feedback.create({
      authorId: 'tutor-1',
      problemId: 'problem-1',
      scope: FeedbackScope.PROBLEM,
      text: 'Texto anterior.',
    });
    existing.id = 'feedback-uuid';
    feedbackRepository.findGeneralProblemFeedback.mockResolvedValue(existing);

    const result = await useCase.execute({
      roomId: 'room-1',
      problemId: 'problem-1',
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

  it('rejects if problem does not belong to room', async () => {
    problemRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        roomId: 'room-1',
        problemId: 'problem-1',
        tutorId: 'tutor-1',
        text: 'Texto.',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
