import { initialsOf } from '@/sessions/domain/roll-call/build-roll-call';
import type { PlanningPoker } from '../../domain/entities/planning-poker';
import type { PokerRound, PokerRoundStatus } from '../../domain/entities/poker-round';
import type { PokerParticipant } from '../../domain/repositories/planning-poker.repository';
import type { PokerVote } from '../../domain/repositories/poker-round.repository';

export interface PokerStudent {
  id: string;
  name: string;
  initials: string;
  hasPhoto: boolean;
  seatNumber: number | null;
}

export interface TableSeat {
  seat: number;
  student: PokerStudent | null;
  evaluated: boolean;
  voted: boolean;
}

export interface RevealedVote {
  seat: number;
  score: number;
  student: PokerStudent | null;
}

export interface RoundReveal {
  votes: RevealedVote[];
  average: number | null;
  totalVotes: number;
  missing: number;
}

export interface RoundView {
  roundId: string;
  number: number;
  status: PokerRoundStatus;
  evaluated: PokerStudent;
  table: TableSeat[];
  expectedVoters: number;
  votedSeats: number[];
  reveal: RoundReveal | null;
}

export interface StudentRoundView extends RoundView {
  isEvaluated: boolean;
  myVote: number | null;
  mySeat: number | null;
}

export interface CompletedRound {
  student: PokerStudent;
  average: number | null;
  finalGrade: number;
  adjusted: boolean;
}

export interface PokerStateView {
  poker: PlanningPoker;
  participants: PokerStudent[];
  absentees: PokerStudent[];
  queue: string[];
  completed: CompletedRound[];
}

export interface TutorPokerState extends PokerStateView {
  current: RoundView | null;
}

export interface StudentPokerState extends PokerStateView {
  isParticipant: boolean;
  current: StudentRoundView | null;
}

export interface RoundViewInput {
  round: PokerRound;
  votes: PokerVote[];
  students: Map<string, PokerStudent>;
  anonymous: boolean;
}

export const toPokerStudent = (participant: PokerParticipant): PokerStudent => ({
  id: participant.studentId,
  name: participant.name,
  initials: initialsOf(participant.name),
  hasPhoto: participant.hasPhoto,
  seatNumber: participant.seatNumber,
});

export const indexStudents = (students: PokerStudent[]): Map<string, PokerStudent> =>
  new Map(students.map((student) => [student.id, student]));

const studentOf = (students: Map<string, PokerStudent>, id: string): PokerStudent =>
  students.get(id) ?? {
    id,
    name: 'Aluno removido',
    initials: '?',
    hasPhoto: false,
    seatNumber: null,
  };

const visibleStudent = (input: RoundViewInput, studentId: string): PokerStudent | null =>
  input.anonymous && studentId !== input.round.studentId
    ? null
    : studentOf(input.students, studentId);

function buildTable(input: RoundViewInput): TableSeat[] {
  const voted = new Set(input.votes.map((vote) => vote.voterId));
  return input.round.seats.map(({ seat, studentId }) => ({
    seat,
    student: visibleStudent(input, studentId),
    evaluated: studentId === input.round.studentId,
    voted: voted.has(studentId),
  }));
}

function buildReveal(input: RoundViewInput): RoundReveal {
  const votes = input.votes
    .map((vote) => ({
      seat: input.round.seatOf(vote.voterId) ?? 0,
      score: vote.score,
      student: visibleStudent(input, vote.voterId),
    }))
    .sort((left, right) => left.seat - right.seat);
  const expected = input.round.voterIds.length;
  return {
    votes,
    average: input.round.average,
    totalVotes: votes.length,
    missing: expected - votes.length,
  };
}

export function buildRoundView(input: RoundViewInput): RoundView {
  const table = buildTable(input);
  return {
    roundId: input.round.id,
    number: input.round.number,
    status: input.round.status,
    evaluated: studentOf(input.students, input.round.studentId),
    table,
    expectedVoters: input.round.voterIds.length,
    votedSeats: table.filter((seat) => seat.voted).map((seat) => seat.seat),
    reveal: input.round.isVoting ? null : buildReveal(input),
  };
}

export function buildStudentRoundView(input: RoundViewInput, viewerId: string): StudentRoundView {
  return {
    ...buildRoundView(input),
    isEvaluated: input.round.studentId === viewerId,
    myVote: input.votes.find((vote) => vote.voterId === viewerId)?.score ?? null,
    mySeat: input.round.seatOf(viewerId),
  };
}

export function buildCompleted(
  rounds: PokerRound[],
  students: Map<string, PokerStudent>,
): CompletedRound[] {
  return rounds.map((round) => ({
    student: studentOf(students, round.studentId),
    average: round.average,
    finalGrade: round.decision?.finalGrade ?? 0,
    adjusted: round.decision?.adjusted ?? false,
  }));
}
