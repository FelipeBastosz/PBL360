import { describe, expect, it } from 'vitest';
import { avatarColor, firstName, matchesName } from './members';

describe('avatarColor', () => {
  it('always gives the same colour to the same name', () => {
    expect(avatarColor('Ana Silva Santos')).toBe(avatarColor('Ana Silva Santos'));
  });

  it('returns a hex colour from the palette', () => {
    expect(avatarColor('Bruno Reis')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('firstName', () => {
  it('keeps only the first name', () => {
    expect(firstName('  Ana Silva Santos ')).toBe('Ana');
  });
});

describe('matchesName', () => {
  it('ignores case and accents', () => {
    expect(matchesName('João Pedro', 'joao')).toBe(true);
    expect(matchesName('Heitor Lima', 'LIMA')).toBe(true);
  });

  it('matches everyone when the query is empty', () => {
    expect(matchesName('Carla Dias', '  ')).toBe(true);
  });

  it('rejects names that do not contain the query', () => {
    expect(matchesName('Carla Dias', 'bruno')).toBe(false);
  });
});
