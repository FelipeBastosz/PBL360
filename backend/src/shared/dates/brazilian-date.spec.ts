import { validate } from 'class-validator';
import { IsBrazilianDate, toBrazilianDate, toIsoDate } from './brazilian-date';

class SampleDto {
  @IsBrazilianDate()
  date: unknown;
}

describe('brazilian-date helpers', () => {
  it('converts between Brazilian and ISO date strings and preserves invalid inputs', () => {
    expect(toIsoDate('27-11-2026')).toBe('2026-11-27');
    expect(toIsoDate('2026-11-27')).toBe('2026-11-27');
    expect(toBrazilianDate('2026-11-27')).toBe('27-11-2026');
    expect(toBrazilianDate(null)).toBeNull();
  });

  it('validates calendar dates in DD-MM-YYYY format', async () => {
    const valid = Object.assign(new SampleDto(), { date: '29-02-2024' });
    const invalidCalendar = Object.assign(new SampleDto(), { date: '30-02-2024' });
    const invalidFormat = Object.assign(new SampleDto(), { date: '2024-02-29' });
    const nonString = Object.assign(new SampleDto(), { date: 12345 });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(invalidCalendar)).resolves.toHaveLength(1);
    await expect(validate(invalidFormat)).resolves.toHaveLength(1);
    await expect(validate(nonString)).resolves.toHaveLength(1);
  });
});
