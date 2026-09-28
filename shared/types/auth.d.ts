export type UserTypePayload = 'PROFESSOR' | 'ALUNO';

export type UserResponse = {
  id: string;
  nome: string;
  email: string;
  tipo: UserTypePayload;
  matricula: string | null;
  fotoUrl: string | null;
  ativo: boolean;
  criadoEm: string;
};

export type LoginPayload = {
  email: string;
  senha: string;
};

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
  tipo: UserTypePayload;
  matricula?: string;
  fotoUrl?: string;
};

export type VerifyEmailCodePayload = {
  usuarioId: string;
  email: string;
  codigo: string;
};

export type ResendVerificationCodePayload = {
  email: string;
};

export type RequestPasswordResetPayload = {
  email: string;
};

export type ValidatePasswordResetCodePayload = {
  email: string;
  codigo: string;
};

export type ResetPasswordPayload = {
  token: string;
  novaSenha: string;
};

export type SessionResponse = {
  token: string;
  expiraEm: string;
  usuario: UserResponse;
};

export type RegisterResponse = {
  mensagem: string;
  usuarioId: string;
  usuario: UserResponse;
};

export type VerificationResponse = SessionResponse & {
  mensagem: string;
};

export type PasswordResetTokenResponse = {
  token: string;
  expiraEm: string;
};

export type MessageResponse = {
  mensagem: string;
};

export type ErrorResponse = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type PendingVerificationResponse = ErrorResponse & {
  motivo: 'CONTA_NAO_VERIFICADA';
  usuarioId: string;
  email: string;
};
