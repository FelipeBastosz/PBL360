import { describe, expect, it } from 'vitest';
import {
  type RegisterFormValues,
  toRegisterPayload,
  validateLoginForm,
  validateNewPasswordForm,
  validateRegisterForm,
} from './authForms';

const photo = new File(['png'], 'ana.png', { type: 'image/png' });

const student: RegisterFormValues = {
  tipo: 'ALUNO',
  nome: '  Ana Souza ',
  email: ' Ana@Discente.uefs.br ',
  matricula: '20240001',
  foto: photo,
  senha: 'senha-secreta',
  confirmacao: 'senha-secreta',
  termosAceitos: true,
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
    const errors = validateRegisterForm({ ...student, matricula: '', foto: null });

    expect(errors.matricula).toBe('Informe sua matrícula.');
    expect(errors.foto).toBe('Envie uma foto sua.');
  });

  it('validates the optional fields a professor chose to fill', () => {
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    const errors = validateRegisterForm({
      ...student,
      tipo: 'PROFESSOR',
      email: 'carlos@uefs.br',
      matricula: '1999',
      foto: svg,
    });

    expect(errors.matricula).toBe('A matrícula deve conter exatamente 8 dígitos.');
    expect(errors.foto).toBe('A foto deve ser uma imagem JPEG, PNG ou WebP.');
  });

  it('does not require registration number nor photo from professors', () => {
    const errors = validateRegisterForm({
      ...student,
      tipo: 'PROFESSOR',
      email: 'carlos@uefs.br',
      matricula: '',
      foto: null,
    });

    expect(Object.values(errors).filter(Boolean)).toEqual([]);
  });

  it('requires accepting terms of use and privacy policy', () => {
    const errors = validateRegisterForm({
      ...student,
      termosAceitos: false,
    });

    expect(errors.termosAceitos).toBe(
      'O cadastro só pode ser realizado se você marcar que leu e concorda com os Termos de Uso e Política de Privacidade.',
    );
  });
});

describe('toRegisterPayload', () => {
  it('normalizes the student payload', () => {
    expect(toRegisterPayload(student, '1.2')).toEqual({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'ALUNO',
      versaoTermo: '1.2',
      aceitaTermos: true,
      matricula: '20240001',
      foto: photo,
    });
  });

  it('leaves out the optional fields a professor did not fill', () => {
    expect(
      toRegisterPayload({ ...student, tipo: 'PROFESSOR', matricula: '', foto: null }, '1.2'),
    ).toEqual({
      nome: 'Ana Souza',
      email: 'ana@discente.uefs.br',
      senha: 'senha-secreta',
      tipo: 'PROFESSOR',
      versaoTermo: '1.2',
      aceitaTermos: true,
    });
  });

  it('keeps the optional fields a professor did fill', () => {
    expect(toRegisterPayload({ ...student, tipo: 'PROFESSOR' }, '1.2')).toMatchObject({
      tipo: 'PROFESSOR',
      versaoTermo: '1.2',
      aceitaTermos: true,
      matricula: '20240001',
      foto: photo,
    });
  });
});
