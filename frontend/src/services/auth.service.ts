import type {
  LoginPayload,
  MessageResponse,
  PasswordResetTokenResponse,
  RegisterPayload,
  RegisterResponse,
  RequestPasswordResetPayload,
  ResendVerificationCodePayload,
  ResetPasswordPayload,
  SessionResponse,
  ValidatePasswordResetCodePayload,
  VerificationResponse,
  VerifyEmailCodePayload,
} from '@/types/auth';
import { api } from './api';

const BASE = '/autenticacao';

function toRegisterFormData(payload: RegisterPayload): FormData {
  const data = new FormData();
  Object.entries(payload).forEach(([field, value]) => {
    if (value !== undefined) data.append(field, value);
  });
  return data;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<SessionResponse>(`${BASE}/login`, payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api
      .post<RegisterResponse>(`${BASE}/registro`, toRegisterFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  verifyEmailCode: (payload: VerifyEmailCodePayload) =>
    api.post<VerificationResponse>(`${BASE}/verificar-codigo`, payload).then((r) => r.data),

  resendVerificationCode: (payload: ResendVerificationCodePayload) =>
    api.post<MessageResponse>(`${BASE}/reenviar-codigo`, payload).then((r) => r.data),

  requestPasswordReset: (payload: RequestPasswordResetPayload) =>
    api.post<MessageResponse>(`${BASE}/recuperacao-senha`, payload).then((r) => r.data),

  validatePasswordResetCode: (payload: ValidatePasswordResetCodePayload) =>
    api
      .post<PasswordResetTokenResponse>(`${BASE}/recuperacao-senha/validar-codigo`, payload)
      .then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<MessageResponse>(`${BASE}/redefinir-senha`, payload).then((r) => r.data),
};
