import { describe, expect, it } from 'vitest';
import { seatPositions } from './seatLayout';

const ASPECT_X = 3;
const ASPECT_Y = 5;

const gap = (a: { left: number; top: number }, b: { left: number; top: number }) =>
  Math.hypot((a.left - b.left) * ASPECT_X, (a.top - b.top) * ASPECT_Y);

describe('seatPositions', () => {
  it('starts at the top of the table and goes clockwise', () => {
    const [first, second] = seatPositions(4);

    expect(first).toEqual({ seat: 1, left: 50, top: 6 });
    expect(second!.left).toBeGreaterThan(50);
  });

  it('keeps every seat inside the drawing for a class of 15', () => {
    const positions = seatPositions(15);

    expect(positions).toHaveLength(15);
    expect(positions.every((p) => p.left >= 0 && p.left <= 100 && p.top >= 0 && p.top <= 100)).toBe(
      true,
    );
  });

  it('spaces neighbouring seats evenly around the table', () => {
    const positions = seatPositions(15);
    const gaps = positions.map((position, index) =>
      gap(position, positions[(index + 1) % positions.length]!),
    );

    const average = gaps.reduce((total, value) => total + value, 0) / gaps.length;

    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(average * 0.05);
  });

  it('leaves room between 56px seats on a 288px wide table', () => {
    const positions = seatPositions(15);
    const pixelsPerUnit = 288 / (100 * ASPECT_X);
    const gaps = positions.map((position, index) =>
      gap(position, positions[(index + 1) % positions.length]!),
    );

    expect(Math.min(...gaps) * pixelsPerUnit).toBeGreaterThan(56);
  });

  it('returns no seats for an empty room', () => {
    expect(seatPositions(0)).toEqual([]);
  });
});
