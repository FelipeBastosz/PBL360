import {
  PlanningPoker,
  PokerOrder,
  PokerStatus,
  type PlanningPokerProps,
} from '../domain/entities/planning-poker';
import { PokerRound, PokerRoundStatus, type PokerRoundProps } from '../domain/entities/poker-round';
import type { PlanningPokerRepository } from '../domain/repositories/planning-poker.repository';
import type { PokerRoundRepository } from '../domain/repositories/poker-round.repository';
import type { PokerEventPublisher } from '../application/services/poker-event-publisher';

export const aPoker = (overrides: Partial<PlanningPokerProps> = {}): PlanningPoker =>
  new PlanningPoker({
    id: 'poker-1',
    sessionId: 'session-1',
    anonymous: false,
    order: PokerOrder.SEQUENTIAL,
    status: PokerStatus.OPEN,
    queue: ['bruno', 'carla'],
    createdBy: 'tutor-1',
    createdAt: new Date('2026-10-12T10:00:00Z'),
    ...overrides,
  });

export const aRound = (overrides: Partial<PokerRoundProps> = {}): PokerRound =>
  new PokerRound({
    id: 'round-1',
    pokerId: 'poker-1',
    studentId: 'ana',
    number: 1,
    status: PokerRoundStatus.VOTING,
    seats: [
      { seat: 1, studentId: 'ana' },
      { seat: 2, studentId: 'bruno' },
      { seat: 3, studentId: 'carla' },
    ],
    average: null,
    decision: null,
    ...overrides,
  });

export const aRoster = () => ({
  participants: ['ana', 'bruno', 'carla'].map((id, index) => ({
    studentId: id,
    name: `Aluno ${id}`,
    seatNumber: index + 1,
    hasPhoto: false,
  })),
  absentees: [],
});

export const pokerRepositoryDouble = (): jest.Mocked<PlanningPokerRepository> => ({
  findOpenBySession: jest.fn(),
  findRoster: jest.fn().mockResolvedValue(aRoster()),
  create: jest.fn(),
  updateQueue: jest.fn(),
  close: jest.fn(),
});

export const roundRepositoryDouble = (): jest.Mocked<PokerRoundRepository> => ({
  findOpen: jest.fn().mockResolvedValue(null),
  findById: jest.fn(),
  findDecided: jest.fn().mockResolvedValue([]),
  findLast: jest.fn().mockResolvedValue(null),
  open: jest.fn(),
  cancel: jest.fn(),
  reveal: jest.fn().mockResolvedValue(true),
  restart: jest.fn().mockResolvedValue(true),
  decide: jest.fn().mockResolvedValue(true),
  castVote: jest.fn().mockResolvedValue(true),
  findVotes: jest.fn().mockResolvedValue([]),
});

export const publisherDouble = (): jest.Mocked<PokerEventPublisher> => ({ publish: jest.fn() });
