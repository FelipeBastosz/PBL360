import { describe, expect, it } from 'vitest';
import { formatRoleScore, parseRoleScore, roleBadge, roleLabel } from './sessionRoles';

describe('sessionRoles', () => {
  it('names each role and its short badge', () => {
    expect(roleLabel('COORDENADOR')).toBe('Coordenador');
    expect(roleBadge('SECRETARIO_QUADRO')).toBe('Sec. Quadro');
  });

  it('reads the additional score with comma or dot, between 0 and 1', () => {
    expect(parseRoleScore('0,5')).toBe(0.5);
    expect(parseRoleScore('1.0')).toBe(1);
    expect(parseRoleScore('  ')).toBeNull();
    expect(parseRoleScore('1,5')).toBeUndefined();
    expect(parseRoleScore('abc')).toBeUndefined();
  });

  it('shows the score with a comma', () => {
    expect(formatRoleScore(0.5)).toBe('0,5');
    expect(formatRoleScore(null)).toBe('');
  });
});
