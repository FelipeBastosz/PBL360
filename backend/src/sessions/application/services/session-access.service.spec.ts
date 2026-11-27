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

  it('allows access via sessionId and tutorId when tutor has room access', async () => {
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });
    assertRoomAccess.mockResolvedValue(undefined);

    await expect(service.assertTutorCanAccessSession('session-1', 'co-tutor-1')).resolves.toBe(
      session,
    );

    expect(findSession).toHaveBeenCalledWith('session-1');
    expect(findProblem).toHaveBeenCalledWith('problem-1');
    expect(assertRoomAccess).toHaveBeenCalledWith('room-1', 'co-tutor-1');
  });

  it.each([
    ['session is missing', null, { id: 'problem-1', roomId: 'room-1' }],
    ['problem is missing', session, null],
  ])(
    'returns not found when %s for tutor session access',
    async (_label, foundSession, problem) => {
      findSession.mockResolvedValue(foundSession);
      findProblem.mockResolvedValue(problem);

      await expect(service.assertTutorCanAccessSession('session-1', 'tutor-1')).rejects.toThrow(
        NotFoundError,
      );
    },
  );

  it('rejects access via sessionId when tutor is not authorized in room', async () => {
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });
    assertRoomAccess.mockRejectedValue(new Error('Forbidden'));

    await expect(service.assertTutorCanAccessSession('session-1', 'other-tutor')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('allows a room member to access the session, problem and room', async () => {
    const member = { id: 'student-1', role: 'STUDENT' };
    const problem = { id: 'problem-1', roomId: 'room-1' };
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue(problem);
    const assertMemberCanAccessRoom = jest.fn().mockResolvedValue(undefined);
    service = new SessionAccessService(
      { findById: findSession } as unknown as SessionRepository,
      { findById: findProblem } as unknown as ProblemRepository,
      {
        assertTutorCanAccessRoom: assertRoomAccess,
        assertMemberCanAccessRoom,
      } as unknown as RoomAccessService,
    );

    await expect(
      service.assertMemberCanAccessSession('session-1', member as never),
    ).resolves.toEqual({
      session,
      problem,
      roomId: 'room-1',
    });
    expect(assertMemberCanAccessRoom).toHaveBeenCalledWith('room-1', member);
  });

  it.each([
    ['session is missing', null, { id: 'problem-1', roomId: 'room-1' }],
    ['problem is missing', session, null],
  ])('hides access when %s', async (_description, foundSession, foundProblem) => {
    findSession.mockResolvedValue(foundSession);
    findProblem.mockResolvedValue(foundProblem);
    const assertMemberCanAccessRoom = jest.fn();
    service = new SessionAccessService(
      { findById: findSession } as unknown as SessionRepository,
      { findById: findProblem } as unknown as ProblemRepository,
      {
        assertTutorCanAccessRoom: assertRoomAccess,
        assertMemberCanAccessRoom,
      } as unknown as RoomAccessService,
    );

    await expect(service.assertMemberCanAccessSession('session-1', {} as never)).rejects.toThrow(
      NotFoundError,
    );
    expect(assertMemberCanAccessRoom).not.toHaveBeenCalled();
  });

  it('verifies room access and problem ownership in assertTutorCanAccessProblem', async () => {
    assertRoomAccess.mockResolvedValue(undefined);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });

    await expect(
      service.assertTutorCanAccessProblem('room-1', 'problem-1', 'tutor-1'),
    ).resolves.toBeUndefined();
    expect(assertRoomAccess).toHaveBeenCalledWith('room-1', 'tutor-1');
    expect(findProblem).toHaveBeenCalledWith('problem-1');
  });
});
