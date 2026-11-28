import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionAccessService } from './session-access.service';

describe('SessionAccessService', () => {
  const session = { id: 'session-1', problemId: 'problem-1' };
  const studentMember = { id: 'student-1', type: UserType.STUDENT };
  let service: SessionAccessService;
  let findSession: jest.Mock;
  let findProblem: jest.Mock;
  let assertRoomAccess: jest.Mock;
  let assertMemberRoomAccess: jest.Mock;

  beforeEach(() => {
    findSession = jest.fn();
    findProblem = jest.fn();
    assertRoomAccess = jest.fn();
    assertMemberRoomAccess = jest.fn();
    service = new SessionAccessService(
      { findById: findSession } as unknown as SessionRepository,
      { findById: findProblem } as unknown as ProblemRepository,
      {
        assertTutorCanAccessRoom: assertRoomAccess,
        assertMemberCanAccessRoom: assertMemberRoomAccess,
      } as unknown as RoomAccessService,
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

  it('rejects access via sessionId when tutor is not authorized in room', async () => {
    findSession.mockResolvedValue(session);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });
    assertRoomAccess.mockRejectedValue(new Error('Forbidden'));

    await expect(service.assertTutorCanAccessSession('session-1', 'other-tutor')).rejects.toThrow(
      'Forbidden',
    );
  });

  it('allows a room member to access a problem belonging to the room', async () => {
    assertMemberRoomAccess.mockResolvedValue(undefined);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'room-1' });

    await expect(
      service.assertMemberCanAccessProblem('room-1', 'problem-1', studentMember),
    ).resolves.toBeUndefined();

    expect(assertMemberRoomAccess).toHaveBeenCalledWith('room-1', studentMember);
    expect(findProblem).toHaveBeenCalledWith('problem-1');
  });

  it('rejects problem access before loading the problem when user is not a room member', async () => {
    assertMemberRoomAccess.mockRejectedValue(new ForbiddenError('negado'));

    await expect(
      service.assertMemberCanAccessProblem('room-1', 'problem-1', studentMember),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(findProblem).not.toHaveBeenCalled();
  });

  it('hides a problem that belongs to another room for member problem access', async () => {
    assertMemberRoomAccess.mockResolvedValue(undefined);
    findProblem.mockResolvedValue({ id: 'problem-1', roomId: 'other-room' });

    await expect(
      service.assertMemberCanAccessProblem('room-1', 'problem-1', studentMember),
    ).rejects.toThrow(new NotFoundError('Problema não encontrado.'));
  });
});
