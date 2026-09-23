import { describe, expect, it } from 'vitest';
import {
  type RegisterFormValues,
  toRegisterPayload,
  validateLoginForm,
  validateNewPasswordForm,
  validateRegisterForm,
} from './authForms';

const student: RegisterFormValues = {
  tipo: 'ALUNO',
  nome: '  Ana Souza ',
  email: ' Ana@Discente.uefs.br ',
  matricula: '20240001',
  fotoUrl: 'https://example.com/ana.png',
  senha: 'senha-secreta',
  confirmacao: 'senha-secreta',
};

describe('validateLoginForm', () => {
  it('flags both empty fields', () => {
    expect(validateLoginForm({ email: '', senha: '' })).toEqual({
      email: 'Informe seu e-mail.',
      senha: 'Informe sua senha.',
    });
  });
});

describe('validateNewPasswordForm', () => {
  it('flags a confirmation that does not match', () => {
    expect(
      validateNewPasswordForm({ senha: 'senha-secreta', confirmacao: 'outra-senha' }).confirmacao,
    ).toBe('As senhas não coincidem.');
  });
});

describe('validateRegisterForm', () => {
  it('passes a complete student form', () => {
    expect(Object.values(validateRegisterForm(student)).filter(Boolean)).toEqual([]);
  });

  it('requires registration number and photo from students', () => {
    const errors = validateRegisterForm({ ...student, matricula: '', fotoUrl: '' });

    expect(errors.matricula).toBe('Informe sua matrícula.');
    expect(errors.fotoUrl).toBe('Informe o link da sua foto.');
  });

  it('does not require registration number nor photo from professors', () => {
    const errors = validateRegisterForm({
      ...student,
      tipo: 'PROFESSOR',
      email: 'carlos@uefs.br',
      matricula: '',
      fotoUrl: '',
    });

    expect(Object.values(errors).filter(Boolean)).toEqual([]);
  });
});

describe('toRegisterPayload', () => {
  it('normalizes the student payload', () => {
    expect(toRegisterPayload(student)).toEqual({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'ALUNO',
      matricula: '20240001',
      fotoUrl: 'https://example.com/ana.png',
    });
  });

  it('leaves student-only fields out of a professor payload', () => {
    expect(toRegisterPayload({ ...student, tipo: 'PROFESSOR' })).toEqual({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'PROFESSOR',
    });
  });
});
