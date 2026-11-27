import { UserType } from '@/users/domain/enums/user-type.enum';
import { GetPlanningPokerStateUseCase } from './get-planning-poker-state.use-case';

describe('GetPlanningPokerStateUseCase', () => {
  it('builds tutor state for a tutor member', async () => {
    const poker = { id: 'p1' };
    const tutorState = { participants: [], completed: [], current: null };
    const context = { forMember: jest.fn().mockResolvedValue(poker) };
    const state = { forTutor: jest.fn().mockResolvedValue(tutorState), forStudent: jest.fn() };
    const useCase = new GetPlanningPokerStateUseCase(context as never, state as never);
    await expect(useCase.execute('s1', { id: 't1', type: UserType.TUTOR })).resolves.toEqual({
      audience: 'TUTOR',
      state: tutorState,
    });
    expect(context.forMember).toHaveBeenCalledWith('s1', { id: 't1', type: UserType.TUTOR });
    expect(state.forTutor).toHaveBeenCalledWith(poker);
    expect(state.forStudent).not.toHaveBeenCalled();
  });

  it('builds the requesting student state for a student member', async () => {
    const poker = { id: 'p1' };
    const studentState = { participants: [], completed: [], current: null, isParticipant: false };
    const context = { forMember: jest.fn().mockResolvedValue(poker) };
    const state = { forTutor: jest.fn(), forStudent: jest.fn().mockResolvedValue(studentState) };
    const useCase = new GetPlanningPokerStateUseCase(context as never, state as never);
    await expect(useCase.execute('s1', { id: 'u1', type: UserType.STUDENT })).resolves.toEqual({
      audience: 'STUDENT',
      state: studentState,
    });
    expect(state.forStudent).toHaveBeenCalledWith(poker, 'u1');
    expect(state.forTutor).not.toHaveBeenCalled();
  });
});
