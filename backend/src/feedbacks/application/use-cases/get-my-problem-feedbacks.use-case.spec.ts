import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { ReceivedFeedbackRepository } from '../../domain/repositories/received-feedback.repository';
import { GetMyProblemFeedbacksUseCase } from './get-my-problem-feedbacks.use-case';

describe('GetMyProblemFeedbacksUseCase', () => {
  const access = { assertMemberCanAccessRoom: jest.fn() };
  const problems = { findById: jest.fn() };
  const feedbacks: jest.Mocked<ReceivedFeedbackRepository> = {
    readSession: jest.fn(),
    readProblem: jest.fn(),
  };
  const useCase = new GetMyProblemFeedbacksUseCase(
    access as unknown as RoomAccessService,
    problems as unknown as ProblemRepository,
    feedbacks,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    problems.findById.mockResolvedValue({ id: 'problem', roomId: 'room' });
  });

  it('returns only the authenticated student feedbacks', async () => {
    const result = { finalScore: 8.5, individual: null, general: null, sessions: [] };
    feedbacks.readProblem.mockResolvedValue(result);
    expect(await useCase.execute('room', 'problem', 'student')).toBe(result);
    expect(access.assertMemberCanAccessRoom).toHaveBeenCalledWith('room', {
      id: 'student',
      type: UserType.STUDENT,
    });
    expect(feedbacks.readProblem).toHaveBeenCalledWith('problem', 'student', 'room');
  });

  it('rejects a student outside the room before reading feedbacks', async () => {
    access.assertMemberCanAccessRoom.mockRejectedValue(
      new ForbiddenError('Você não participa desta sala.'),
    );
    await expect(useCase.execute('room', 'problem', 'outsider')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(problems.findById).not.toHaveBeenCalled();
    expect(feedbacks.readProblem).not.toHaveBeenCalled();
  });

  it.each([null, { id: 'problem', roomId: 'another-room' }])(
    'rejects a missing or mismatched problem: %s',
    async (problem) => {
      problems.findById.mockResolvedValue(problem);
      await expect(useCase.execute('room', 'problem', 'student')).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(feedbacks.readProblem).not.toHaveBeenCalled();
    },
  );
});
