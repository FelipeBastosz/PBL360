export type LogoSeat = {
  head: number;
  body: number;
  chair?: number;
  hand?: number;
  props: number[];
  direction: [number, number];
};

export const LOGO_SEATS: LogoSeat[] = [
  { head: 28, body: 27, props: [24], direction: [0, -1] },
  { head: 25, body: 22, chair: 20, props: [17], direction: [0.7, -0.7] },
  { head: 15, body: 13, chair: 11, props: [9, 10], direction: [1, 0.1] },
  { head: 7, body: 6, chair: 1, hand: 3, props: [], direction: [0.5, 0.85] },
  { head: 8, body: 5, chair: 2, hand: 4, props: [], direction: [-0.5, 0.85] },
  { head: 16, body: 14, chair: 12, props: [], direction: [-1, 0.1] },
  { head: 26, body: 23, chair: 21, props: [18], direction: [-0.7, -0.7] },
];

export const LOGO_TABLE = 19;

export const LOGO_LAPTOP = 24;

export const LOGO_ARCS = [30, 29, 0];
