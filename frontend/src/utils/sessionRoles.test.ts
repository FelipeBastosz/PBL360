import { describe, expect, it } from 'vitest';
import { formatRoleScore, parseRoleScore, roleBadge, roleLabel } from './sessionRoles';

describe('sessionRoles', () => {
  it('formats role strings correctly', () => {
    expect(roleLabel('COORDENADOR')).toBe('Coordenador');
    expect(roleLabel('COORDINATOR')).toBe('Coordenador');
    expect(roleLabel('SECRETARIO_QUADRO')).toBe('Secretário de Quadro');
    expect(roleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
  });

  it('formats role badges correctly', () => {
    expect(roleBadge('COORDENADOR')).toBe('Coord.');
    expect(roleBadge('SECRETARIO_QUADRO')).toBe('Sec. Quadro');
    expect(roleBadge('SECRETARIO_MESA')).toBe('Sec. Mesa');
  });

  it('reads the additional score with comma or dot, between 0 and 10', () => {
    expect(parseRoleScore('0,5')).toBe(0.5);
    expect(parseRoleScore('10.0')).toBe(10);
    expect(parseRoleScore('8')).toBe(8);
    expect(parseRoleScore('  ')).toBeNull();
    expect(parseRoleScore('11')).toBeUndefined();
    expect(parseRoleScore('-1')).toBeUndefined();
    expect(parseRoleScore('abc')).toBeUndefined();
  });

  it('shows the score with a comma', () => {
    expect(formatRoleScore(0.5)).toBe('0,5');
    expect(formatRoleScore(8.75)).toBe('8,8');
    expect(formatRoleScore(null)).toBe('');
  });
});
