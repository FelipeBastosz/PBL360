import type { SessionAccessService } from '@/sessions/application/services/session-access.service';
import type { Session } from '@/sessions/domain/entities/session.entity';
import type { SessionRepository } from '@/sessions/domain/repositories/session.repository';
import { ConflictError } from '@/shared/errors/application.error';
import { PokerOrder } from '../../domain/entities/planning-poker';
import { aPoker, pokerRepositoryDouble } from '../../testing/poker-fixtures';
import type { PokerStateService } from '../services/poker-state.service';
import { StartPlanningPokerUseCase } from './start-planning-poker.use-case';

const SUBMISSIONS = { rollCallSaved: true, presentStudents: 3, selfSubmitted: 0, peerSubmitted: 0 };
const INPUT = {
  sessionId: 'session-1',
  tutorId: 'tutor-1',
  anonymous: true,
  order: PokerOrder.SEQUENTIAL,
};

describe('StartPlanningPokerUseCase', () => {
  let pokers: ReturnType<typeof pokerRepositoryDouble>;
  let sessions: { countReleaseSubmissions: jest.Mock };
  let session: Partial<Session>;
  let useCase: StartPlanningPokerUseCase;

  beforeEach(() => {
    pokers = pokerRepositoryDouble();
    pokers.findOpenBySession.mockResolvedValue(null);
    pokers.create.mockResolvedValue(aPoker());
    session = { id: 'session-1', peerEvalReleased: false };
    sessions = { countReleaseSubmissions: jest.fn().mockResolvedValue(SUBMISSIONS) };
    const access = {
      assertTutorCanAccessSessionById: jest.fn().mockResolvedValue({ session, roomId: 'room' }),
    };
    const state = { forTutor: jest.fn().mockResolvedValue({}) };
    useCase = new StartPlanningPokerUseCase(
      access as unknown as SessionAccessService,
      sessions as unknown as SessionRepository,
      pokers,
      state as unknown as PokerStateService,
    );
  });

  it('queues the present students in table order', async () => {
    await useCase.execute(INPUT);

    expect(pokers.create).toHaveBeenCalledWith(
      expect.objectContaining({ queue: ['ana', 'bruno', 'carla'], anonymous: true }),
    );
  });

  it('requires the roll call to be saved', async () => {
    sessions.countReleaseSubmissions.mockResolvedValue({ ...SUBMISSIONS, rollCallSaved: false });

    await expect(useCase.execute(INPUT)).rejects.toThrow('Salve a chamada para começar.');
  });

  it('cannot run alongside a released peer form', async () => {
    session.peerEvalReleased = true;

    await expect(useCase.execute(INPUT)).rejects.toThrow(ConflictError);
    expect(pokers.create).not.toHaveBeenCalled();
  });

  it('refuses a second open planning poker', async () => {
    pokers.findOpenBySession.mockResolvedValue(aPoker());

    await expect(useCase.execute(INPUT)).rejects.toThrow(ConflictError);
  });
});
