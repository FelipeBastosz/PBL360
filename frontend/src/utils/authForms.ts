import type { RegisterPayload, UserTypePayload } from '@/types/auth';
import {
  validateCode,
  validateEmail,
  validateInstitutionalEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhoto,
  validateRegistrationNumber,
  validateRequiredPassword,
} from './validation';

type Errors<T> = Partial<Record<keyof T, string>>;

export type LoginFormValues = { email: string; senha: string };
export type EmailFormValues = { email: string };
export type CodeFormValues = { codigo: string };
export type NewPasswordFormValues = { senha: string; confirmacao: string };
export type RegisterFormValues = {
  tipo: UserTypePayload;
  nome: string;
  email: string;
  matricula: string;
  foto: File | null;
  senha: string;
  confirmacao: string;
};

export function validateLoginForm(values: LoginFormValues): Errors<LoginFormValues> {
  return { email: validateEmail(values.email), senha: validateRequiredPassword(values.senha) };
}

export function validateEmailForm(values: EmailFormValues): Errors<EmailFormValues> {
  return { email: validateEmail(values.email) };
}

export function validateCodeForm(values: CodeFormValues): Errors<CodeFormValues> {
  return { codigo: validateCode(values.codigo) };
}

export function validateNewPasswordForm(
  values: NewPasswordFormValues,
): Errors<NewPasswordFormValues> {
  return {
    senha: validateNewPassword(values.senha),
    confirmacao: validatePasswordConfirmation(values.senha, values.confirmacao),
  };
}

export function validateRegisterForm(values: RegisterFormValues): Errors<RegisterFormValues> {
  const isStudent = values.tipo === 'ALUNO';
  return {
    nome: validateName(values.nome),
    email: validateInstitutionalEmail(values.email),
    matricula: isStudent ? validateRegistrationNumber(values.matricula) : undefined,
    foto: isStudent ? validatePhoto(values.foto) : undefined,
    ...validateNewPasswordForm(values),
  };
}

export function toRegisterPayload(values: RegisterFormValues): RegisterPayload {
  const base = {
    nome: values.nome.trim(),
    email: values.email.trim().toLowerCase(),
    senha: values.senha,
    tipo: values.tipo,
  };
  if (values.tipo !== 'ALUNO') return base;
  return { ...base, matricula: values.matricula.trim(), foto: values.foto ?? undefined };
}
