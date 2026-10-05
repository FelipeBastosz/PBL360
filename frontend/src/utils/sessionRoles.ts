import type { SessionRole } from '@/types/session';

export const SESSION_ROLE_OPTIONS: { value: SessionRole; label: string; badge: string }[] = [
  { value: 'SECRETARIO_QUADRO', label: 'Secretário de Quadro', badge: 'Sec. Quadro' },
  { value: 'COORDENADOR', label: 'Coordenador', badge: 'Coord.' },
  { value: 'SECRETARIO_MESA', label: 'Secretário de Mesa', badge: 'Sec. Mesa' },
];

export function roleLabel(role: SessionRole): string {
  return SESSION_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function roleBadge(role: SessionRole): string {
  return SESSION_ROLE_OPTIONS.find((option) => option.value === role)?.badge ?? role;
}

export function parseRoleScore(value: string): number | null | undefined {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const score = Number(normalized);
  if (!Number.isFinite(score) || score < 0 || score > 1) return undefined;
  return Math.round(score * 100) / 100;
}

export function formatRoleScore(score: number | null): string {
  return score === null ? '' : score.toFixed(1).replace('.', ',');
}
