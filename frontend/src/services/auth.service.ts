import { api } from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ValidateCodeRequest,
  ValidateCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
} from '../types/auth';

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/autenticacao/login', payload);
    return response.data;
  },

  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/autenticacao/registro', payload);
    return response.data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>(
      '/autenticacao/recuperacao-senha',
      payload,
    );
    return response.data;
  },

  validateCode: async (payload: ValidateCodeRequest): Promise<ValidateCodeResponse> => {
    const response = await api.post<ValidateCodeResponse>(
      '/autenticacao/recuperacao-senha/validar-codigo',
      payload,
    );
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>(
      '/autenticacao/redefinir-senha',
      payload,
    );
    return response.data;
  },

  verifyAccount: async (payload: VerifyAccountRequest): Promise<VerifyAccountResponse> => {
    const response = await api.post<VerifyAccountResponse>(
      '/autenticacao/verificar-codigo',
      payload,
    );
    return response.data;
  },

  resendVerificationCode: async (
    payload: ResendVerificationCodeRequest,
  ): Promise<ResendVerificationCodeResponse> => {
    const response = await api.post<ResendVerificationCodeResponse>(
      '/autenticacao/reenviar-codigo',
      payload,
    );
    return response.data;
  },
};
