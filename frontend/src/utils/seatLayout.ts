export type SeatPosition = {
  seat: number;
  left: number;
  top: number;
};

const RADIUS_X = 41;
const RADIUS_Y = 44;

export function seatPositions(count: number): SeatPosition[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return {
      seat: index + 1,
      left: Number((50 + RADIUS_X * Math.cos(angle)).toFixed(2)),
      top: Number((50 + RADIUS_Y * Math.sin(angle)).toFixed(2)),
    };
  });
}
