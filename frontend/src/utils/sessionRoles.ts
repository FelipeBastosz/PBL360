import type { SessionRole } from '@/types/session';

export const ROLE_LABELS: Record<string, string> = {
  COORDENADOR: 'Coordenador',
  COORDINATOR: 'Coordenador',
  SECRETARIO_QUADRO: 'Secretário de Quadro',
  BOARD_SECRETARY: 'Secretário de Quadro',
  SECRETARIO_MESA: 'Secretário de Mesa',
  TABLE_SECRETARY: 'Secretário de Mesa',
};

export const roleLabel = (role: string): string => ROLE_LABELS[role] ?? role;

export const SESSION_ROLE_OPTIONS: { value: SessionRole; label: string }[] = [
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'SECRETARIO_QUADRO', label: 'Secretário de Quadro' },
  { value: 'SECRETARIO_MESA', label: 'Secretário de Mesa' },
];

export function roleBadge(role: SessionRole): string {
  if (role === 'COORDENADOR' || (role as string) === 'COORDINATOR') return 'Coord.';
  if (role === 'SECRETARIO_QUADRO' || (role as string) === 'BOARD_SECRETARY') return 'Sec. Quadro';
  return 'Sec. Mesa';
}

export function normalizeSessionRole(role?: string | null): SessionRole | null {
  if (!role) return null;
  if (role === 'COORDINATOR' || role === 'COORDENADOR') return 'COORDENADOR';
  if (role === 'BOARD_SECRETARY' || role === 'SECRETARIO_QUADRO') return 'SECRETARIO_QUADRO';
  if (role === 'TABLE_SECRETARY' || role === 'SECRETARIO_MESA') return 'SECRETARIO_MESA';
  return role as SessionRole;
}
