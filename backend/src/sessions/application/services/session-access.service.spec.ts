import { NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionAccessService } from './session-access.service';

describe('SessionAccessService', () => {
  const session = { id: 'session-1', problemId: 'problem-1' };
  let service: SessionAccessService;
  let findSession: jest.Mock;
  let findProblem: jest.Mock;
  let assertRoomAccess: jest.Mock;

  beforeEach(() => {
    findSession = jest.fn();
    findProblem = jest.fn();
    assertRoomAccess = jest.fn();
    service = new SessionAccessService(
      { findById: findSession } as unknown as SessionRepository,
      { findById: findProblem } as unknown as ProblemRepository,
      { assertTutorCanAccessRoom: assertRoomAccess } as unknown as RoomAccessService,
    );
  });

  it('resolves session to problem and room before delegating room access', async () => {
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });

    await expect(
      service.assertTutorCanAccessSession('room-1', 'problem-1', 'session-1', 'tutor-1'),
    ).resolves.toBe(session);

    expect(findProblem).toHaveBeenCalledWith('problem-1');
    expect(assertRoomAccess).toHaveBeenCalledWith('room-1', 'tutor-1');
  });

  it('hides a session outside the requested problem', async () => {
    findSession.mockResolvedValue({ ...session, problemId: 'other-problem' });

    await expect(
      service.assertTutorCanAccessSession('room-1', 'problem-1', 'session-1', 'tutor-1'),
    ).rejects.toThrow(NotFoundError);
    expect(findProblem).not.toHaveBeenCalled();
    expect(assertRoomAccess).not.toHaveBeenCalled();
  });

  it('rejects access when the problem does not belong to the requested room', async () => {
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'other-room' });

    await expect(
      service.assertTutorCanAccessSession('room-1', 'problem-1', 'session-1', 'tutor-1'),
    ).rejects.toThrow(NotFoundError);
    expect(assertRoomAccess).not.toHaveBeenCalled();
  });
});
