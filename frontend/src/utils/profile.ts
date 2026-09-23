import type { UserTypePayload } from '@/types/auth';

const PROFILE_BY_PARAM: Record<string, UserTypePayload> = {
  aluno: 'ALUNO',
  professor: 'PROFESSOR',
};

const PARAM_BY_PROFILE: Record<UserTypePayload, string> = {
  ALUNO: 'aluno',
  PROFESSOR: 'professor',
};

const LABEL_BY_PROFILE: Record<UserTypePayload, string> = {
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor',
};

export function parseProfileParam(param: string | null): UserTypePayload | null {
  if (!param) return null;
  return PROFILE_BY_PARAM[param.toLowerCase()] ?? null;
}

export function toProfileParam(profile: UserTypePayload): string {
  return PARAM_BY_PROFILE[profile];
}

export function profileLabel(profile: UserTypePayload): string {
  return LABEL_BY_PROFILE[profile];
}
