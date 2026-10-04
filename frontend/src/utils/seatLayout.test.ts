import { describe, expect, it } from 'vitest';
import { seatPositions } from './seatLayout';

describe('seatPositions', () => {
  it('numbers the seats clockwise from the top of the table', () => {
    const [first, second] = seatPositions(4);

    expect(first).toEqual({ seat: 1, left: 50, top: 6 });
    expect(second).toEqual({ seat: 2, left: 91, top: 50 });
  });

  it('keeps every seat inside the drawing for a class of 15', () => {
    const positions = seatPositions(15);

    expect(positions).toHaveLength(15);
    expect(positions.every((p) => p.left >= 0 && p.left <= 100 && p.top >= 0 && p.top <= 100)).toBe(
      true,
    );
  });

  it('returns no seats for an empty room', () => {
    expect(seatPositions(0)).toEqual([]);
  });
});
