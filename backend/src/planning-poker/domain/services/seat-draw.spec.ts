import { drawSeats } from './seat-draw';

const STUDENTS = ['ana', 'bruno', 'carla', 'diego'];
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length]!;
};

describe('drawSeats', () => {
  it('keeps the roll call order when names are shown', () => {
    expect(drawSeats(STUDENTS, false, null)).toEqual([
      { seat: 1, studentId: 'ana' },
      { seat: 2, studentId: 'bruno' },
      { seat: 3, studentId: 'carla' },
      { seat: 4, studentId: 'diego' },
    ]);
  });

  it('shuffles the seats in anonymous mode', () => {
    const seats = drawSeats(STUDENTS, true, null, sequence(0, 0, 0));

    expect(seats.map((seat) => seat.studentId)).toEqual(['bruno', 'carla', 'diego', 'ana']);
  });

  it('avoids repeating the previous arrangement', () => {
    const previous = drawSeats(STUDENTS, true, null, sequence(0.99));

    const next = drawSeats(STUDENTS, true, previous, sequence(0.99));

    expect(next).not.toEqual(previous);
    expect(next.map((seat) => seat.studentId).sort()).toEqual([...STUDENTS].sort());
  });

  it('numbers the seats from one', () => {
    const seats = drawSeats(STUDENTS, true, null);

    expect(seats.map((seat) => seat.seat)).toEqual([1, 2, 3, 4]);
  });
});
