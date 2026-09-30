import { describe, expect, it } from 'vitest';
import { validateProblemForm, type ProblemFormValues } from './problemForms';

describe('validateProblemForm', () => {
  it('returns error when title is empty or only whitespace', () => {
    const payload: ProblemFormValues = { titulo: '   ' };
    const errors = validateProblemForm(payload);

    expect(errors.titulo).toBe('O título do problema é obrigatório.');
  });

  it('returns error when title exceeds 120 characters', () => {
    const hugeTitle = 'A'.repeat(121);
    const payload: ProblemFormValues = { titulo: hugeTitle };
    const errors = validateProblemForm(payload);

    expect(errors.titulo).toBe('O título deve ter no máximo 120 caracteres.');
  });

  it('returns no errors when payload is valid', () => {
    const validPayload: ProblemFormValues = { titulo: 'Problema 1 - Introdução' };
    const errors = validateProblemForm(validPayload);

    expect(errors.titulo).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
