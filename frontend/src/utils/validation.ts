const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const INSTITUTIONAL_EMAIL = /^[^@\s]+@(discente\.)?uefs\.br$/i;
const REGISTRATION_NUMBER = /^\d{8}$/;
const CODE = /^\d{6}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Informe seu e-mail.';
  if (!EMAIL.test(value)) return 'Informe um e-mail válido.';
  return undefined;
}

export function validateInstitutionalEmail(email: string): string | undefined {
  const error = validateEmail(email);
  if (error) return error;
  if (!INSTITUTIONAL_EMAIL.test(email.trim())) {
    return 'Use seu e-mail institucional (@uefs.br ou @discente.uefs.br).';
  }
  return undefined;
}

export function validateRequiredPassword(password: string): string | undefined {
  return password ? undefined : 'Informe sua senha.';
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Crie uma senha.';
  if (password.length < PASSWORD_MIN) return 'A senha deve ter no mínimo 8 caracteres.';
  if (password.length > PASSWORD_MAX) return 'A senha deve ter no máximo 72 caracteres.';
  return undefined;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return 'Repita a senha.';
  return password === confirmation ? undefined : 'As senhas não coincidem.';
}

export function validateName(name: string): string | undefined {
  const length = name.trim().length;
  if (!length) return 'Informe seu nome.';
  if (length < 3 || length > 120) return 'O nome deve ter entre 3 e 120 caracteres.';
  return undefined;
}

export function validateRegistrationNumber(value: string): string | undefined {
  if (!value.trim()) return 'Informe sua matrícula.';
  return REGISTRATION_NUMBER.test(value.trim())
    ? undefined
    : 'A matrícula deve conter exatamente 8 dígitos.';
}

export function validatePhotoUrl(value: string): string | undefined {
  if (!value.trim()) return 'Informe o link da sua foto.';
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? undefined : 'Informe um link válido.';
  } catch {
    return 'Informe um link válido.';
  }
}

export function validateCode(code: string): string | undefined {
  if (!code.trim()) return 'Informe o código recebido por e-mail.';
  return CODE.test(code.trim()) ? undefined : 'O código deve conter exatamente 6 dígitos.';
}
