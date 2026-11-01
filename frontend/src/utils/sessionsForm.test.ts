import { describe, expect, it } from 'vitest';
import {
  validateSessionForm,
  toInputDate,
  toApiDate,
  formatSessionDisplayDate,
  type SessionFormValues,
} from './sessionsForm';

describe('validateSessionForm', () => {
  it('returns errors when required fields are empty', () => {
    const payload: SessionFormValues = {
      titulo: '   ',
      descricao: '',
      data: '',
    };

    const errors = validateSessionForm(payload);

    expect(errors.titulo).toBe('O título da sessão é obrigatório.');
    expect(errors.data).toBe('A data da sessão é obrigatória.');
  });

  it('returns error when title exceeds 120 characters', () => {
    const errors = validateSessionForm({
      titulo: 'A'.repeat(121),
      descricao: '',
      data: '2026-10-15',
    });

    expect(errors.titulo).toBe('O título deve ter no máximo 120 caracteres.');
  });

  it('returns error when description exceeds 1000 characters', () => {
    const errors = validateSessionForm({
      titulo: 'Sessão 1',
      descricao: 'D'.repeat(1001),
      data: '2026-10-15',
    });

    expect(errors.descricao).toBe('A descrição deve ter no máximo 1000 caracteres.');
  });

  it('returns no errors when payload is valid', () => {
    const validPayload: SessionFormValues = {
      titulo: 'Introdução ao problema',
      descricao: 'Primeira discussão tutorial',
      data: '2026-10-15',
    };

    const errors = validateSessionForm(validPayload);

    expect(errors.titulo).toBeUndefined();
    expect(errors.descricao).toBeUndefined();
    expect(errors.data).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('toInputDate (API DD-MM-AAAA -> Input AAAA-MM-DD)', () => {
  it('returns empty string when value is null or empty', () => {
    expect(toInputDate(null)).toBe('');
    expect(toInputDate('')).toBe('');
  });

  it('converts DD-MM-AAAA to AAAA-MM-DD', () => {
    expect(toInputDate('20-10-2026')).toBe('2026-10-20');
  });

  it('preserves date if it is already in AAAA-MM-DD format', () => {
    expect(toInputDate('2026-10-20')).toBe('2026-10-20');
  });
});

describe('toApiDate (Input AAAA-MM-DD -> API DD-MM-AAAA)', () => {
  it('returns empty string when value is null or empty', () => {
    expect(toApiDate(null)).toBe('');
    expect(toApiDate('')).toBe('');
  });

  it('converts AAAA-MM-DD to DD-MM-AAAA', () => {
    expect(toApiDate('2026-10-20')).toBe('20-10-2026');
  });

  it('preserves date if it is already in DD-MM-AAAA format', () => {
    expect(toApiDate('20-10-2026')).toBe('20-10-2026');
  });

  describe('formatSessionDisplayDate', () => {
    it('returns empty string when date is null or empty', () => {
      expect(formatSessionDisplayDate(null)).toBe('');
      expect(formatSessionDisplayDate('')).toBe('');
    });

    it('formats DD-MM-AAAA date correctly', () => {
      expect(formatSessionDisplayDate('15-10-2026')).toMatch(/15 out/i);
    });

    it('formats AAAA-MM-DD date correctly', () => {
      expect(formatSessionDisplayDate('2026-10-15')).toMatch(/15 out/i);
    });
  });
});
