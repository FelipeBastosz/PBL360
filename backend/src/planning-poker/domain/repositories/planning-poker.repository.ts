import type { PlanningPoker, PokerOrder } from '../entities/planning-poker';

export const PLANNING_POKER_REPOSITORY = Symbol('PLANNING_POKER_REPOSITORY');

export interface NewPlanningPoker {
  sessionId: string;
  anonymous: boolean;
  order: PokerOrder;
  queue: string[];
  createdBy: string;
}

export interface PokerParticipant {
  studentId: string;
  name: string;
  seatNumber: number | null;
  hasPhoto: boolean;
}

export interface PokerRoster {
  participants: PokerParticipant[];
  absentees: PokerParticipant[];
}

export interface PlanningPokerRepository {
  findOpenBySession(sessionId: string): Promise<PlanningPoker | null>;
  findRoster(sessionId: string): Promise<PokerRoster>;
  create(poker: NewPlanningPoker): Promise<PlanningPoker>;
  updateQueue(pokerId: string, queue: string[]): Promise<void>;
  close(pokerId: string, closedBy: string): Promise<boolean>;
}
