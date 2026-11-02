import { describe, expect, it } from 'vitest';
import { toSlug } from './slug';

describe('toSlug', () => {
  it('converts accented characters and spaces into clean hyphens', () => {
    expect(toSlug('Problema 1 - Prontuário Eletrônico')).toBe('problema-1-prontuario-eletronico');
    expect(toSlug('Sessão 1 - Abertura')).toBe('sessao-1-abertura');
  });

  it('collapses multiple special characters and trims trailing hyphens', () => {
    expect(toSlug('  Avaliação Clínica & Diagnóstico -- Final! ')).toBe(
      'avaliacao-clinica-diagnostico-final',
    );
  });

  it('handles empty and whitespace-only strings', () => {
    expect(toSlug('')).toBe('');
    expect(toSlug('   ')).toBe('');
  });
});
