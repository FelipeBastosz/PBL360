import { Inject, Injectable } from '@nestjs/common';
import type { PlanningPoker } from '../../domain/entities/planning-poker';
import type { PokerRound } from '../../domain/entities/poker-round';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
  type PokerVote,
} from '../../domain/repositories/poker-round.repository';
import {
  buildCompleted,
  buildRoundView,
  buildStudentRoundView,
  indexStudents,
  toPokerStudent,
  type PokerStateView,
  type PokerStudent,
  type RoundView,
  type StudentPokerState,
  type TutorPokerState,
} from './poker-views';

interface LoadedState {
  base: PokerStateView;
  students: Map<string, PokerStudent>;
  current: PokerRound | null;
  votes: PokerVote[];
}

@Injectable()
export class PokerStateService {
  constructor(
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
  ) {}

  async students(sessionId: string): Promise<Map<string, PokerStudent>> {
    const roster = await this.pokers.findRoster(sessionId);
    return indexStudents([...roster.participants, ...roster.absentees].map(toPokerStudent));
  }

  async roundView(poker: PlanningPoker, round: PokerRound): Promise<RoundView> {
    const [students, votes] = await Promise.all([
      this.students(poker.sessionId),
      this.rounds.findVotes(round.id),
    ]);
    return buildRoundView({ round, votes, students, anonymous: poker.anonymous });
  }

  async forTutor(poker: PlanningPoker): Promise<TutorPokerState> {
    const { base, students, current, votes } = await this.load(poker);
    const input = { votes, students, anonymous: poker.anonymous };
    return { ...base, current: current ? buildRoundView({ ...input, round: current }) : null };
  }

  async forStudent(poker: PlanningPoker, studentId: string): Promise<StudentPokerState> {
    const { base, students, current, votes } = await this.load(poker);
    const isParticipant = base.participants.some((student) => student.id === studentId);
    const input = { votes, students, anonymous: poker.anonymous };
    const view =
      current && isParticipant
        ? buildStudentRoundView({ ...input, round: current }, studentId)
        : null;
    return { ...base, isParticipant, current: view };
  }

  private async load(poker: PlanningPoker): Promise<LoadedState> {
    const [roster, current, decided] = await Promise.all([
      this.pokers.findRoster(poker.sessionId),
      this.rounds.findOpen(poker.id),
      this.rounds.findDecided(poker.id),
    ]);
    const participants = roster.participants.map(toPokerStudent);
    const absentees = roster.absentees.map(toPokerStudent);
    const students = indexStudents([...participants, ...absentees]);
    const votes = current ? await this.rounds.findVotes(current.id) : [];
    const completed = buildCompleted(decided, students);
    const base = { poker, participants, absentees, queue: poker.queue, completed };
    return { base, students, current, votes };
  }
}
