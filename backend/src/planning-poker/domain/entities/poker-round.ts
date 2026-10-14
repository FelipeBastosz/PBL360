export enum PokerRoundStatus {
  VOTING = 'VOTING',
  REVEALED = 'REVEALED',
  DECIDED = 'DECIDED',
}

export interface SeatAssignment {
  seat: number;
  studentId: string;
}

export interface PokerDecision {
  finalGrade: number;
  adjusted: boolean;
  justification: string | null;
  decidedBy: string;
  decidedAt: Date;
}

export interface PokerRoundProps {
  id: string;
  pokerId: string;
  studentId: string;
  number: number;
  status: PokerRoundStatus;
  seats: SeatAssignment[];
  average: number | null;
  decision: PokerDecision | null;
}

export class PokerRound {
  readonly id: string;
  readonly pokerId: string;
  readonly studentId: string;
  readonly number: number;
  readonly status: PokerRoundStatus;
  readonly seats: SeatAssignment[];
  readonly average: number | null;
  readonly decision: PokerDecision | null;

  constructor(props: PokerRoundProps) {
    this.id = props.id;
    this.pokerId = props.pokerId;
    this.studentId = props.studentId;
    this.number = props.number;
    this.status = props.status;
    this.seats = props.seats.map((seat) => ({ ...seat }));
    this.average = props.average;
    this.decision = props.decision;
  }

  get voterIds(): string[] {
    return this.seats.map((seat) => seat.studentId).filter((id) => id !== this.studentId);
  }

  isVoter(studentId: string): boolean {
    return this.voterIds.includes(studentId);
  }

  seatOf(studentId: string): number | null {
    return this.seats.find((seat) => seat.studentId === studentId)?.seat ?? null;
  }

  get isVoting(): boolean {
    return this.status === PokerRoundStatus.VOTING;
  }

  get isRevealed(): boolean {
    return this.status === PokerRoundStatus.REVEALED;
  }
}
