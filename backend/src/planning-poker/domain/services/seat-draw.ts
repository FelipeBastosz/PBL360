import type { SeatAssignment } from '../entities/poker-round';

export type RandomSource = () => number;

const toSeats = (studentIds: string[]): SeatAssignment[] =>
  studentIds.map((studentId, index) => ({ seat: index + 1, studentId }));

function shuffle(studentIds: string[], random: RandomSource): string[] {
  const shuffled = [...studentIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
  }
  return shuffled;
}

const sameArrangement = (seats: SeatAssignment[], previous: SeatAssignment[]): boolean =>
  seats.length === previous.length &&
  seats.every((seat) =>
    previous.some((p) => p.seat === seat.seat && p.studentId === seat.studentId),
  );

const rotate = (studentIds: string[]): string[] => [...studentIds.slice(1), studentIds[0]!];

export function drawSeats(
  orderedStudentIds: string[],
  anonymous: boolean,
  previous: SeatAssignment[] | null,
  random: RandomSource = Math.random,
): SeatAssignment[] {
  if (!anonymous) return toSeats(orderedStudentIds);
  const shuffled = shuffle(orderedStudentIds, random);
  const seats = toSeats(shuffled);
  if (!previous || shuffled.length < 2 || !sameArrangement(seats, previous)) return seats;
  return toSeats(rotate(shuffled));
}
