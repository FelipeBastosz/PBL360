import { Injectable } from '@nestjs/common';
import {
  RoomAccessService,
  type RoomMember,
} from '@/rooms/application/services/room-access.service';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  ProblemRepository,
  PROBLEM_REPOSITORY,
} from '@/problems/domain/repositories/problem.repository';
import { Inject } from '@nestjs/common';
import { Session } from '../../domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

@Injectable()
export class SessionAccessService {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async assertTutorCanAccessProblem(
    roomId: string,
    problemId: string,
    tutorId: string,
  ): Promise<void> {
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    await this.assertProblemBelongsToRoom(problemId, roomId);
  }

  async assertTutorCanAccessSession(sessionId: string, tutorId: string): Promise<Session>;
  async assertTutorCanAccessSession(
    roomId: string,
    problemId: string,
    sessionId: string,
    tutorId: string,
  ): Promise<Session>;
  async assertTutorCanAccessSession(
    first: string,
    second: string,
    third?: string,
    fourth?: string,
  ): Promise<Session> {
    if (!third || !fourth) {
      const { session } = await this.assertTutorCanAccessSessionById(first, second);
      return session;
    }
    return this.assertSessionInRoom(first, second, third, fourth);
  }

  private async assertSessionInRoom(
    roomId: string,
    problemId: string,
    sessionId: string,
    tutorId: string,
  ): Promise<Session> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.problemId !== problemId) {
      throw new NotFoundError('Sessão não encontrada.');
    }
    await this.assertProblemBelongsToRoom(problemId, roomId);
    await this.roomAccess.assertTutorCanAccessRoom(roomId, tutorId);
    return session;
  }

  async assertTutorCanAccessSessionById(
    sessionId: string,
    tutorId: string,
  ): Promise<{ session: Session; roomId: string }> {
    const session = await this.sessions.findById(sessionId);
    if (!session) throw new NotFoundError('Sessão não encontrada.');
    const problem = await this.problems.findById(session.problemId);
    if (!problem) throw new NotFoundError('Sessão não encontrada.');
    await this.roomAccess.assertTutorCanAccessRoom(problem.roomId, tutorId);
    return { session, roomId: problem.roomId };
  }

  async assertMemberCanAccessSession(
    sessionId: string,
    member: RoomMember,
  ): Promise<{ session: Session; problem: Problem; roomId: string }> {
    const session = await this.sessions.findById(sessionId);
    const problem = session ? await this.problems.findById(session.problemId) : null;
    if (!session || !problem) throw new NotFoundError('Sessão não encontrada.');
    await this.roomAccess.assertMemberCanAccessRoom(problem.roomId, member);
    return { session, problem, roomId: problem.roomId };
  }

  private async assertProblemBelongsToRoom(problemId: string, roomId: string): Promise<void> {
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
