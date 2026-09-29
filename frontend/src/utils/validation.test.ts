import { describe, expect, it } from 'vitest';
import {
  validateCode,
  validateEmail,
  validateInstitutionalEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhoto,
  PHOTO_MAX_BYTES,
  validateRegistrationNumber,
  validateRequiredPassword,
} from './validation';

describe('validateEmail', () => {
  it('asks for the e-mail when it is empty', () => {
    expect(validateEmail('  ')).toBe('Informe seu e-mail.');
  });

  it('rejects a malformed e-mail', () => {
    expect(validateEmail('ana@')).toBe('Informe um e-mail válido.');
  });

  it('accepts a well-formed e-mail', () => {
    expect(validateEmail('ana@gmail.com')).toBeUndefined();
  });
});

describe('validateInstitutionalEmail', () => {
  it('rejects an e-mail outside the institution', () => {
    expect(validateInstitutionalEmail('ana@gmail.com')).toBe(
      'Use seu e-mail institucional (@uefs.br ou @discente.uefs.br).',
    );
  });

  it.each(['carlos@uefs.br', 'ana@discente.uefs.br', 'ANA@Discente.UEFS.br'])(
    'accepts %s',
    (email) => {
      expect(validateInstitutionalEmail(email)).toBeUndefined();
    },
  );
});

describe('password rules', () => {
  it('requires the password on login', () => {
    expect(validateRequiredPassword('')).toBe('Informe sua senha.');
    expect(validateRequiredPassword('x')).toBeUndefined();
  });

  it('enforces the 8 to 72 characters range on a new password', () => {
    expect(validateNewPassword('')).toBe('Crie uma senha.');
    expect(validateNewPassword('1234567')).toBe('A senha deve ter no mínimo 8 caracteres.');
    expect(validateNewPassword('a'.repeat(73))).toBe('A senha deve ter no máximo 72 caracteres.');
    expect(validateNewPassword('12345678')).toBeUndefined();
  });

  it('requires the confirmation to match the password', () => {
    expect(validatePasswordConfirmation('senha-forte', '')).toBe('Repita a senha.');
    expect(validatePasswordConfirmation('senha-forte', 'senha-fraca')).toBe(
      'As senhas não coincidem.',
    );
    expect(validatePasswordConfirmation('senha-forte', 'senha-forte')).toBeUndefined();
  });
});

describe('registration fields', () => {
  it('bounds the name length', () => {
    expect(validateName('')).toBe('Informe seu nome.');
    expect(validateName('Al')).toBe('O nome deve ter entre 3 e 120 caracteres.');
    expect(validateName('Ana Souza')).toBeUndefined();
  });

  it('requires exactly 8 digits for the registration number', () => {
    expect(validateRegistrationNumber('')).toBe('Informe sua matrícula.');
    expect(validateRegistrationNumber('2024001')).toBe(
      'A matrícula deve conter exatamente 8 dígitos.',
    );
    expect(validateRegistrationNumber('20240001')).toBeUndefined();
  });

  it('requires a JPEG, PNG or WebP photo of up to 2 MB', () => {
    const image = (type: string, size = 1) => new File([new Uint8Array(size)], 'foto', { type });

    expect(validatePhoto(null)).toBe('Envie uma foto sua.');
    expect(validatePhoto(image('image/svg+xml'))).toBe(
      'A foto deve ser uma imagem JPEG, PNG ou WebP.',
    );
    expect(validatePhoto(image('image/png', PHOTO_MAX_BYTES + 1))).toBe(
      'A foto deve ter no máximo 2 MB.',
    );
    expect(validatePhoto(image('image/jpeg', PHOTO_MAX_BYTES))).toBeUndefined();
    expect(validatePhoto(image('image/webp'))).toBeUndefined();
  });
});

describe('validateCode', () => {
  it('requires a 6-digit code', () => {
    expect(validateCode('')).toBe('Informe o código recebido por e-mail.');
    expect(validateCode('12a456')).toBe('O código deve conter exatamente 6 dígitos.');
    expect(validateCode('123456')).toBeUndefined();
  });
});
