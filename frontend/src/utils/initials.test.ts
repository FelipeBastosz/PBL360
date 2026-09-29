import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('takes the first letter of the first two names', () => {
    expect(getInitials('ana maria souza')).toBe('AM');
  });

  it('ignores repeated spaces', () => {
    expect(getInitials('  Carlos   Mendes ')).toBe('CM');
  });

  it('falls back to a placeholder without a name', () => {
    expect(getInitials()).toBe('U');
    expect(getInitials('   ')).toBe('U');
  });
});
