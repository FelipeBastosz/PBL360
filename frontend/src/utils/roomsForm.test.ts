import { describe, expect, it } from 'vitest';
import { validateCreateRoomForm, type CreateRoomFormValues } from './roomsForm';

describe('validateCreateRoomForm', () => {
  it('returns mandatory field errors when values are empty or contain only whitespace', () => {
    const payload: CreateRoomFormValues = {
      codigo: '   ',
      disciplina: '',
      turma: ' ',
      semestre: '',
    };

    const errors = validateCreateRoomForm(payload);

    expect(errors.codigo).toBe('O código é obrigatório.');
    expect(errors.disciplina).toBe('A disciplina é obrigatória.');
    expect(errors.turma).toBe('A turma é obrigatória.');
    expect(errors.semestre).toBe('O semestre é obrigatório.');
  });

  it('validates semester format (AAAA.S where S is 1 or 2)', () => {
    const invalidSemesters = ['2026', '2026.0', '2026.3', '26.2', '2026-2'];

    for (const semester of invalidSemesters) {
      const errors = validateCreateRoomForm({
        codigo: 'TEC409',
        disciplina: 'MI Programação',
        turma: 'TP01',
        semestre: semester, // 👈 Era aqui! Antes estava só "semestre,"
      });

      expect(errors.semestre).toBe('Use o formato AAAA.S (ex.: 2026.2).');
    }
  });

  it('returns no errors when all fields are valid', () => {
    const validPayload: CreateRoomFormValues = {
      codigo: 'TEC409',
      disciplina: 'MI Concorrência e Conectividade',
      turma: 'TP01',
      semestre: '2026.2',
    };

    const errors = validateCreateRoomForm(validPayload);

    expect(errors.codigo).toBeUndefined();
    expect(errors.disciplina).toBeUndefined();
    expect(errors.turma).toBeUndefined();
    expect(errors.semestre).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
