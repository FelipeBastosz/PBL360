export type SeatPosition = {
  seat: number;
  left: number;
  top: number;
};

const RADIUS_X = 41;
const RADIUS_Y = 44;
const ASPECT_X = 3;
const ASPECT_Y = 5;
const SAMPLES = 720;

type Sample = { angle: number; length: number };

function pointAt(angle: number) {
  return { left: 50 + RADIUS_X * Math.cos(angle), top: 50 + RADIUS_Y * Math.sin(angle) };
}

function sampleEllipse(): Sample[] {
  const samples: Sample[] = [{ angle: -Math.PI / 2, length: 0 }];
  for (let step = 1; step <= SAMPLES; step += 1) {
    const angle = -Math.PI / 2 + (step * 2 * Math.PI) / SAMPLES;
    const previous = samples[step - 1]!;
    const from = pointAt(previous.angle);
    const to = pointAt(angle);
    const distance = Math.hypot((to.left - from.left) * ASPECT_X, (to.top - from.top) * ASPECT_Y);
    samples.push({ angle, length: previous.length + distance });
  }
  return samples;
}

export function seatPositions(count: number): SeatPosition[] {
  const samples = sampleEllipse();
  const perimeter = samples[samples.length - 1]!.length;
  return Array.from({ length: count }, (_, index) => {
    const target = (index * perimeter) / count;
    const sample = samples.find((item) => item.length >= target) ?? samples[0]!;
    const { left, top } = pointAt(sample.angle);
    return { seat: index + 1, left: Number(left.toFixed(2)), top: Number(top.toFixed(2)) };
  });
}
