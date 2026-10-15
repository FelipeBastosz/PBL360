export type SeatPosition = {
  seat: number;
  left: number;
  top: number;
};

type Ellipse = { radiusX: number; radiusY: number; aspectX: number; aspectY: number };

const PORTRAIT: Ellipse = { radiusX: 41, radiusY: 44, aspectX: 3, aspectY: 5 };
const LANDSCAPE: Ellipse = { radiusX: 44, radiusY: 40, aspectX: 5, aspectY: 3 };
const SAMPLES = 720;

type Sample = { angle: number; length: number };

function pointAt(ellipse: Ellipse, angle: number) {
  return {
    left: 50 + ellipse.radiusX * Math.cos(angle),
    top: 50 + ellipse.radiusY * Math.sin(angle),
  };
}

function sampleEllipse(ellipse: Ellipse): Sample[] {
  const samples: Sample[] = [{ angle: -Math.PI / 2, length: 0 }];
  for (let step = 1; step <= SAMPLES; step += 1) {
    const angle = -Math.PI / 2 + (step * 2 * Math.PI) / SAMPLES;
    const previous = samples[step - 1]!;
    const from = pointAt(ellipse, previous.angle);
    const to = pointAt(ellipse, angle);
    const distance = Math.hypot(
      (to.left - from.left) * ellipse.aspectX,
      (to.top - from.top) * ellipse.aspectY,
    );
    samples.push({ angle, length: previous.length + distance });
  }
  return samples;
}

export function seatPositions(count: number, landscape = false): SeatPosition[] {
  const ellipse = landscape ? LANDSCAPE : PORTRAIT;
  const samples = sampleEllipse(ellipse);
  const perimeter = samples[samples.length - 1]!.length;
  return Array.from({ length: count }, (_, index) => {
    const target = (index * perimeter) / count;
    const sample = samples.find((item) => item.length >= target) ?? samples[0]!;
    const { left, top } = pointAt(ellipse, sample.angle);
    return { seat: index + 1, left: Number(left.toFixed(2)), top: Number(top.toFixed(2)) };
  });
}
