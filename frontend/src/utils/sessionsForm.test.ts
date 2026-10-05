import { describe, expect, it } from 'vitest';
import { validateSessionForm, type SessionFormValues } from './sessionsForm';

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
