import { UserType } from '@/users/domain/enums/user-type.enum';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import type { SessionAccessService } from '../services/session-access.service';
import type { SessionGeneralEvaluationRepository } from '../../domain/repositories/session-general-evaluation.repository';
import { GetSessionGeneralEvaluationUseCase } from './get-session-general-evaluation.use-case';

describe('GetSessionGeneralEvaluationUseCase', () => {
  let access: jest.Mocked<Pick<SessionAccessService, 'assertMemberCanAccessSession'>>;
  let evaluations: jest.Mocked<Pick<SessionGeneralEvaluationRepository, 'findBySessionId'>>;

  beforeEach(() => {
    access = { assertMemberCanAccessSession: jest.fn() };
    evaluations = { findBySessionId: jest.fn().mockResolvedValue([]) };
  });

  it.each([UserType.TUTOR, UserType.STUDENT])(
    'returns the session evaluations to a linked member with type %s',
    async (type) => {
      const member: RoomMember = { id: 'member-id', type };
      const useCase = new GetSessionGeneralEvaluationUseCase(
        access as SessionAccessService,
        evaluations as SessionGeneralEvaluationRepository,
      );

      await expect(useCase.execute('session-id', member)).resolves.toEqual([]);
      expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith('session-id', member);
      expect(evaluations.findBySessionId).toHaveBeenCalledWith('session-id');
    },
  );

  it('does not query evaluations when the member has no room access', async () => {
    const error = new Error('Access denied');
    access.assertMemberCanAccessSession.mockRejectedValue(error);
    const useCase = new GetSessionGeneralEvaluationUseCase(
      access as SessionAccessService,
      evaluations as SessionGeneralEvaluationRepository,
    );

    await expect(
      useCase.execute('session-id', { id: 'outsider-id', type: UserType.TUTOR }),
    ).rejects.toBe(error);
    expect(evaluations.findBySessionId).not.toHaveBeenCalled();
  });
});
