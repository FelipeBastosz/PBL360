import { pokerAverage } from './poker-average';

describe('pokerAverage', () => {
  it('averages the received votes with two decimals', () => {
    expect(pokerAverage([8, 8.5, 9])).toBe(8.5);
    expect(pokerAverage([7, 8, 8])).toBe(7.67);
  });

  it('returns null when nobody voted', () => {
    expect(pokerAverage([])).toBeNull();
  });
});
