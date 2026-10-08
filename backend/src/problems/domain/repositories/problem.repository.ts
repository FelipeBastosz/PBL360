import type { Problem } from '../entities/problem.entity';

export const PROBLEM_REPOSITORY = Symbol('PROBLEM_REPOSITORY');

export interface ProblemRepository {
  hasEvaluations(problemId: string): Promise<boolean>;
  updateDetails(input: UpdateProblemDetails): Promise<Problem>;
  create(problem: Problem): Promise<Problem>;
  save(problem: Problem): Promise<Problem>;
  findById(id: string): Promise<Problem | null>;
  findByRoomId(roomId: string): Promise<Problem[]>;
  hasSessions(problemId: string): Promise<boolean>;
  countSessions(problemId: string): Promise<number>;
  delete(id: string, roomId: string): Promise<void>;
  countReleaseSubmissions(problemId: string, roomId: string): Promise<ReleaseSubmissions>;
}

export interface ReleaseSubmissions {
  students: number;
  selfSubmitted: number;
  peerSubmitted: number;
}

export interface UpdateProblemDetails {
  id: string;
  roomId: string;
  authorId: string;
  title: string;
  tableId?: string | null;
}
