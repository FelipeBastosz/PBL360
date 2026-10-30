import type { UserTypePayload } from './auth';

export interface UserProfileResponse {
  id: string;
  nome: string;
  email: string;
  tipo: UserTypePayload;
  matricula: string | null;
  possuiFoto: boolean;
}

export interface UpdateUserProfilePayload {
  nome: string;
}

export interface ChangePasswordPayload {
  senhaAtual: string;
  novaSenha: string;
}

