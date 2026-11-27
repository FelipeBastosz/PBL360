import { PokerBlockReason } from '../services/poker-start-policy';
import { GetPlanningPokerAvailabilityUseCase } from './get-planning-poker-availability.use-case';

describe('GetPlanningPokerAvailabilityUseCase', () => {
  it('reports an open poker as available and includes the submission count', async () => {
    const session = { id: 's1', selfEvalReleased: false, peerEvalReleased: false };
    const access = { assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({ session }) };
    const sessions = {
      countReleaseSubmissions: jest.fn().mockResolvedValue({
        rollCallSaved: true,
        presentStudents: 3,
        tutorSubmitted: 0,
        selfSubmitted: 0,
        peerSubmitted: 0,
      }),
    };
    const pokers = { findOpenBySession: jest.fn().mockResolvedValue({ id: 'p1' }) };
    const useCase = new GetPlanningPokerAvailabilityUseCase(
      access as never,
      sessions as never,
      pokers as never,
    );
    await expect(useCase.execute('s1', 't1')).resolves.toEqual({
      blockReason: null,
      presentStudents: 3,
      openPokerId: 'p1',
    });
    expect(sessions.countReleaseSubmissions).toHaveBeenCalledWith('s1');
    expect(pokers.findOpenBySession).toHaveBeenCalledWith('s1');
  });

  it('returns the policy block when no poker is open', async () => {
    const session = { id: 's1', selfEvalReleased: false, peerEvalReleased: false };
    const access = { assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({ session }) };
    const sessions = {
      countReleaseSubmissions: jest.fn().mockResolvedValue({
        rollCallSaved: false,
        presentStudents: 0,
        tutorSubmitted: 0,
        selfSubmitted: 0,
        peerSubmitted: 0,
      }),
    };
    const pokers = { findOpenBySession: jest.fn().mockResolvedValue(null) };
    const useCase = new GetPlanningPokerAvailabilityUseCase(
      access as never,
      sessions as never,
      pokers as never,
    );
    await expect(useCase.execute('s1', 't1')).resolves.toEqual({
      blockReason: PokerBlockReason.ROLL_CALL_MISSING,
      presentStudents: 0,
      openPokerId: null,
    });
  });
});
