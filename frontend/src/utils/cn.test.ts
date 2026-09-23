import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins the truthy classes with a single space', () => {
    expect(cn('px-4', false, 'py-2', null, undefined, 'text-sm')).toBe('px-4 py-2 text-sm');
  });

  it('returns an empty string when every class is falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
