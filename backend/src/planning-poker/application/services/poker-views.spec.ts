import { PokerRound, PokerRoundStatus } from '../../domain/entities/poker-round';
import { toPokerRoundResponse } from '../../infrastructure/http/poker-round.mapper';
import {
  buildRoundView,
  buildStudentRoundView,
  indexStudents,
  toPokerStudent,
} from './poker-views';

const students = indexStudents(
  ['ana', 'bruno', 'carla'].map((id, index) =>
    toPokerStudent({ studentId: id, name: `Aluno ${id}`, seatNumber: index + 1, hasPhoto: false }),
  ),
);

const aRound = (status: PokerRoundStatus, average: number | null = null) =>
  new PokerRound({
    id: 'round',
    pokerId: 'poker',
    studentId: 'ana',
    number: 1,
    status,
    seats: [
      { seat: 1, studentId: 'carla' },
      { seat: 2, studentId: 'ana' },
      { seat: 3, studentId: 'bruno' },
    ],
    average,
    decision: null,
  });

const votes = [
  { voterId: 'bruno', score: 8 },
  { voterId: 'carla', score: 9 },
];

describe('poker views', () => {
  it('marks which seats voted without exposing the scores while voting', () => {
    const view = buildRoundView({
      round: aRound(PokerRoundStatus.VOTING),
      votes,
      students,
      anonymous: false,
    });

    expect(view.votedSeats).toEqual([1, 3]);
    expect(view.reveal).toBeNull();
    expect(view.expectedVoters).toBe(2);
  });

  it('never links a vote to its voter in anonymous mode', () => {
    const view = buildRoundView({
      round: aRound(PokerRoundStatus.REVEALED, 8.5),
      votes,
      students,
      anonymous: true,
    });
    const response = JSON.stringify(toPokerRoundResponse(view));

    expect(response).not.toContain('bruno');
    expect(response).not.toContain('carla');
    expect(view.reveal?.votes).toEqual([
      { seat: 1, score: 9, student: null },
      { seat: 3, score: 8, student: null },
    ]);
  });

  it('keeps the evaluated student identified in anonymous mode', () => {
    const view = buildRoundView({
      round: aRound(PokerRoundStatus.VOTING),
      votes,
      students,
      anonymous: true,
    });

    expect(view.table.find((seat) => seat.evaluated)?.student?.id).toBe('ana');
  });

  it('names each revealed vote when names are shown', () => {
    const view = buildRoundView({
      round: aRound(PokerRoundStatus.REVEALED, 8.5),
      votes,
      students,
      anonymous: false,
    });

    expect(view.reveal?.votes.map((vote) => vote.student?.id)).toEqual(['carla', 'bruno']);
    expect(view.reveal?.missing).toBe(0);
  });

  it('gives the student their own vote and seat', () => {
    const input = { round: aRound(PokerRoundStatus.VOTING), votes, students, anonymous: true };

    const view = buildStudentRoundView(input, 'bruno');

    expect(view).toMatchObject({ myVote: 8, mySeat: 3, isEvaluated: false });
  });
});
