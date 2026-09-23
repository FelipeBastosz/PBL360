// Base Entity Type
export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'ALUNO' | 'PROFESSOR';
  matricula?: number;
  fotoUrl?: string;
  ativo: boolean;
  criadoEm: string;
}

// Request Payload (POST /api/autenticacao/registro)
export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: 'ALUNO' | 'PROFESSOR';
  matricula?: string;
  fotoUrl?: string;
}

// Success Response (Status 201)
export interface RegisterResponse {
  mensagem: string;
  usuarioId: string;
  usuario: User;
}

// Standardized Error Response (Status 400 and 409)
// Useful for typing the Axios interceptor in api.ts
export interface ApiErrorResponse {
  statusCode: number;
  message: string[];
  error: string;
}

// Request Payload (POST /api/autenticacao/login)
export interface LoginRequest {
  email: string;
  senha: string;
}

// Success Response (Status 200)
export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: User;
}

// Specific Error Response for unverified accounts (Status 403)
// Extends the standard ApiErrorResponse to include extra verification fields
export interface UnverifiedAccountErrorResponse extends ApiErrorResponse {
  motivo: 'CONTA_NAO_VERIFICADA';
  usuarioId: string;
  email: string;
}

// Request Payload (POST /api/autenticacao/recuperacao-senha)
export interface ForgotPasswordRequest {
  email: string;
}

// Success Response (Status 200)
export interface ForgotPasswordResponse {
  mensagem: string;
}

// Request Payload (POST /api/autenticacao/recuperacao-senha/validar-codigo)
export interface ValidateCodeRequest {
  email: string;
  codigo: string;
}

// Success Response (Status 200)
export interface ValidateCodeResponse {
  token: string;
  expiraEm: string;
}

// Request Payload (POST /api/autenticacao/redefinir-senha)
export interface ResetPasswordRequest {
  token: string;
  novaSenha: string;
}

// Success Response (Status 200)
export interface ResetPasswordResponse {
  mensagem: string;
}

// Request Payload (POST /api/autenticacao/verificar-codigo)
export interface VerifyAccountRequest {
  usuarioId: string;
  email: string;
  codigo: string;
}

// Success Response (Status 200)
export interface VerifyAccountResponse {
  token: string;
  expiraEm: string;
  usuario: User;
  mensagem: string;
}

// Request Payload (POST /api/autenticacao/reenviar-codigo)
export interface ResendVerificationCodeRequest {
  email: string;
}

// Success Response (Status 200)
export interface ResendVerificationCodeResponse {
  mensagem: string;
}
