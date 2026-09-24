import type { Problem } from '../entities/problem.entity';

export const PROBLEM_REPOSITORY = Symbol('PROBLEM_REPOSITORY');

export interface ProblemRepository {
  save(problem: Problem): Promise<Problem>;
  findById(id: string): Promise<Problem | null>;
  findByRoomId(roomId: string): Promise<Problem[]>;
  countByRoomId(roomId: string): Promise<number>;
  getNextOrderIndex(roomId: string): Promise<number>;
}
