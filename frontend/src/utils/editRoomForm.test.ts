import { describe, expect, it } from 'vitest';
import { validateEditRoomForm, type EditRoomFormValues } from './editRoomForm';

describe('validateEditRoomForm', () => {
  it('returns errors when fields are empty or only whitespace', () => {
    const payload: EditRoomFormValues = {
      turma: '   ',
      semestre: '',
    };

    const errors = validateEditRoomForm(payload);

    expect(errors.turma).toBe('A turma é obrigatória.');
    expect(errors.semestre).toBe('O semestre é obrigatório.');
  });

  it('validates semester format (AAAA.S where S is 1 or 2)', () => {
    const invalidSemesters = ['2026', '2026.0', '2026.3', '26.2', '2026-2'];

    for (const semester of invalidSemesters) {
      const errors = validateEditRoomForm({
        turma: 'TP01',
        semestre: semester,
      });

      expect(errors.semestre).toBe('Use o formato AAAA.S (ex.: 2026.2).');
    }
  });

  it('returns no errors when payload is valid', () => {
    const validPayload: EditRoomFormValues = {
      turma: 'TP02',
      semestre: '2026.2',
    };

    const errors = validateEditRoomForm(validPayload);

    expect(errors.turma).toBeUndefined();
    expect(errors.semestre).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
