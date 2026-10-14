import type {
  PlanningPokerState,
  PokerRound,
  PokerSeat,
  PokerStudent,
} from '@/types/planningPoker';
import { firstName, formatPokerGrade, formatPokerVote } from '@/utils/pokerFormat';

export type SeatTone = 'lilac' | 'ok' | 'you';

export type SeatVariant =
  | 'student'
  | 'done'
  | 'choosable'
  | 'evaluated'
  | 'voted'
  | 'waitingVote'
  | 'anonVoted'
  | 'anonWaiting'
  | 'card'
  | 'emptyCard';

export type SeatView = {
  lugar: number;
  variant: SeatVariant;
  student: { alunoId: string; iniciais: string } | null;
  label: string;
  badge?: { text: string; tone: SeatTone };
  name?: string;
  cardText?: string;
  onTap?: () => void;
};

export type WaitingSeatOptions = {
  grades: Map<string, number | undefined>;
  myId?: string;
  onChoose?: (studentId: string) => void;
};

export function pendingStudents(state: PlanningPokerState): PokerStudent[] {
  const byId = new Map(state.participantes.map((student) => [student.alunoId, student]));
  return state.fila.flatMap((id) => byId.get(id) ?? []);
}

const YOU = { text: 'Você', tone: 'you' as const };

function waitingSeat(student: PokerStudent, index: number, options: WaitingSeatOptions): SeatView {
  const seat: SeatView = { lugar: index + 1, variant: 'student', student, label: student.nome };
  if (options.grades.has(student.alunoId)) {
    const grade = options.grades.get(student.alunoId);
    seat.variant = 'done';
    if (grade !== undefined) seat.badge = { text: formatPokerGrade(grade), tone: 'ok' };
  } else if (options.onChoose) {
    const choose = options.onChoose;
    seat.variant = 'choosable';
    seat.onTap = () => choose(student.alunoId);
    seat.label = `Avaliar ${student.nome}`;
  }
  if (student.alunoId === options.myId) seat.badge = YOU;
  return seat;
}

export function anonymousSeats(count: number): SeatView[] {
  return Array.from({ length: count }, (_, index) => ({
    lugar: index + 1,
    variant: 'anonWaiting' as const,
    student: null,
    label: `Lugar ${index + 1}`,
  }));
}

export function waitingSeats(students: PokerStudent[], options: WaitingSeatOptions): SeatView[] {
  return students.map((student, index) => waitingSeat(student, index, options));
}

type RoundSeatOptions = { anonymous: boolean; mySeat?: number | null };

const identityOf = (seat: PokerSeat) =>
  seat.alunoId && seat.iniciais ? { alunoId: seat.alunoId, iniciais: seat.iniciais } : null;

function revealedSeat(round: PokerRound, seat: PokerSeat, options: RoundSeatOptions): SeatView {
  const vote = round.revelacao?.votos.find((item) => item.lugar === seat.lugar);
  const isMe = seat.lugar === options.mySeat;
  const name = isMe ? 'Você' : !options.anonymous && seat.nome ? firstName(seat.nome) : undefined;
  return {
    lugar: seat.lugar,
    variant: vote ? 'card' : 'emptyCard',
    student: null,
    cardText: vote ? formatPokerVote(vote.nota) : '—',
    name,
    label: `Lugar ${seat.lugar}: ${vote ? formatPokerVote(vote.nota) : 'sem voto'}`,
  };
}

function evaluatedSeat(round: PokerRound, seat: PokerSeat, options: RoundSeatOptions): SeatView {
  const isMe = seat.lugar === options.mySeat;
  return {
    lugar: seat.lugar,
    variant: 'evaluated',
    student: round.avaliado,
    label: round.avaliado.nome,
    badge: { text: isMe ? 'Você' : 'Avaliado', tone: 'lilac' },
  };
}

function votingSeat(seat: PokerSeat, options: RoundSeatOptions): SeatView {
  const status = seat.votou ? ', já votou' : ', aguardando voto';
  const view: SeatView = {
    lugar: seat.lugar,
    variant: options.anonymous
      ? seat.votou
        ? 'anonVoted'
        : 'anonWaiting'
      : seat.votou
        ? 'voted'
        : 'waitingVote',
    student: options.anonymous ? null : identityOf(seat),
    label:
      options.anonymous || !seat.nome ? `Lugar ${seat.lugar}${status}` : `${seat.nome}${status}`,
  };
  if (seat.lugar === options.mySeat) view.badge = YOU;
  return view;
}

export function roundSeats(round: PokerRound, options: RoundSeatOptions): SeatView[] {
  return round.mesa.map((seat) => {
    if (seat.avaliado) return evaluatedSeat(round, seat, options);
    if (round.status === 'REVELADA') return revealedSeat(round, seat, options);
    return votingSeat(seat, options);
  });
}
