import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import type { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { ProblemRepository } from '@/problems/domain/repositories/problem.repository';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { RoomSessionRepository } from '../../domain/repositories/room-session.repository';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionAccessService } from '../services/session-access.service';
import { GetMemberSessionUseCase } from './get-member-session.use-case';
import { ListRoomSessionsUseCase } from './list-room-sessions.use-case';

const student = { id: 'student-1', type: UserType.STUDENT };
const session = { id: 'session-1', problemId: 'problem-1', title: 'Abertura', date: '2026-10-01' };
const problem = { id: 'problem-1', roomId: 'room-1', title: 'Sistema de biblioteca' };

describe('Member session use cases', () => {
  let roomAccess: jest.Mocked<Pick<RoomAccessService, 'assertMemberCanAccessRoom'>>;

  beforeEach(() => {
    roomAccess = { assertMemberCanAccessRoom: jest.fn().mockResolvedValue({}) };
  });

  describe('ListRoomSessionsUseCase', () => {
    const roomSessions: jest.Mocked<RoomSessionRepository> = { findByRoom: jest.fn() };
    const useCase = () =>
      new ListRoomSessionsUseCase(roomAccess as unknown as RoomAccessService, roomSessions);

    it('lists the sessions of the room for a member', async () => {
      roomSessions.findByRoom.mockResolvedValue([]);

      await expect(useCase().execute({ roomId: 'room-1', member: student })).resolves.toEqual([]);
      expect(roomAccess.assertMemberCanAccessRoom).toHaveBeenCalledWith('room-1', student);
      expect(roomSessions.findByRoom).toHaveBeenCalledWith('room-1');
    });

    it('stops someone who is not a member before reading', async () => {
      roomSessions.findByRoom.mockClear();
      roomAccess.assertMemberCanAccessRoom.mockRejectedValue(new ForbiddenError('negado'));

      await expect(useCase().execute({ roomId: 'room-1', member: student })).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(roomSessions.findByRoom).not.toHaveBeenCalled();
    });
  });

  describe('GetMemberSessionUseCase', () => {
    let sessions: jest.Mocked<Pick<SessionRepository, 'findById'>>;
    let problems: jest.Mocked<Pick<ProblemRepository, 'findById'>>;

    const useCase = () =>
      new GetMemberSessionUseCase(
        new SessionAccessService(
          sessions as unknown as SessionRepository,
          problems as unknown as ProblemRepository,
          roomAccess as unknown as RoomAccessService,
        ),
      );

    beforeEach(() => {
      sessions = { findById: jest.fn().mockResolvedValue(session) };
      problems = { findById: jest.fn().mockResolvedValue(problem) };
    });

    it('answers the session with its problem and room for a member', async () => {
      const result = await useCase().execute({ sessionId: 'session-1', member: student });

      expect(result).toMatchObject({ session, problem, roomId: 'room-1' });
      expect(roomAccess.assertMemberCanAccessRoom).toHaveBeenCalledWith('room-1', student);
    });

    it('answers not found for an unknown session', async () => {
      sessions.findById.mockResolvedValue(null);

      await expect(
        useCase().execute({ sessionId: 'missing', member: student }),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(roomAccess.assertMemberCanAccessRoom).not.toHaveBeenCalled();
    });
  });
});
