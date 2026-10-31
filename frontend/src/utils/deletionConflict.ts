import { ApiError } from '@/services/apiError';

export interface ProblemDeletionConflictDetails {
  sessoes?: number;
  notas?: number;
  feedbacks?: number;
  avaliacoes?: number;
}

export interface SessionDeletionConflictDetails {
  chamada?: number;
  papeis?: number;
  observacoes?: number;
  avaliacoes?: number;
  feedbacks?: number;
}

interface ConflictItemDescriptor {
  text: string;
  gender: 'm' | 'f';
  count: number;
}

function extractDetails(error: unknown): Record<string, unknown> | null {
  if (error instanceof ApiError) {
    if (error.status !== 409) return null;
    const body = error.body;
    if (typeof body === 'object' && body !== null && 'detalhes' in body) {
      return (body as { detalhes: Record<string, unknown> }).detalhes;
    }
    return {};
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as {
      status?: number;
      statusCode?: number;
      response?: { status?: number; data?: unknown };
      body?: unknown;
    };
    const status = err.status ?? err.statusCode ?? err.response?.status;
    if (status === 409) {
      const data = err.body ?? err.response?.data ?? err;
      if (typeof data === 'object' && data !== null && 'detalhes' in data) {
        return (data as { detalhes: Record<string, unknown> }).detalhes;
      }
      return {};
    }
  }

  return null;
}

function joinParts(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function joinConflictItems(items: ConflictItemDescriptor[]) {
  const totalCount = items.reduce((acc, curr) => acc + curr.count, 0);
  const allFeminine = items.every((i) => i.gender === 'f');
  const singleGender = items[0]?.gender ?? 'm';
  const text = joinParts(items.map((i) => i.text));

  return { text, totalCount, allFeminine, singleGender };
}

function buildSessionConflictItems(details: Record<string, unknown>): ConflictItemDescriptor[] {
  const items: ConflictItemDescriptor[] = [];
  const add = (count: number, singular: string, plural: string, gender: 'm' | 'f') => {
    if (count > 0)
      items.push({ text: count === 1 ? `1 ${singular}` : `${count} ${plural}`, gender, count });
  };
  add(Number(details.feedbacks ?? 0), 'feedback', 'feedbacks', 'm');
  add(Number(details.avaliacoes ?? 0), 'avaliação', 'avaliações', 'f');
  add(Number(details.chamada ?? 0), 'presença', 'presenças', 'f');
  add(Number(details.papeis ?? 0), 'papel atribuído', 'papéis atribuídos', 'm');
  add(Number(details.observacoes ?? 0), 'observação', 'observações', 'f');
  return items;
}

function buildProblemConflictItems(details: Record<string, unknown>): ConflictItemDescriptor[] {
  const items: ConflictItemDescriptor[] = [];
  const add = (count: number, singular: string, plural: string, gender: 'm' | 'f') => {
    if (count > 0)
      items.push({ text: count === 1 ? `1 ${singular}` : `${count} ${plural}`, gender, count });
  };
  add(Number(details.sessoes ?? 0), 'sessão', 'sessões', 'f');
  add(Number(details.avaliacoes ?? 0), 'avaliação', 'avaliações', 'f');
  add(Number(details.notas ?? 0), 'nota', 'notas', 'f');
  add(Number(details.feedbacks ?? 0), 'feedback', 'feedbacks', 'm');
  return items;
}

function buildConflictMessage(
  items: ConflictItemDescriptor[],
  target: 'a esta sessão' | 'a este problema',
  fallback: string | null,
): string {
  if (items.length === 0) {
    return fallback ?? `Não é possível excluir: existem registros vinculados ${target}.`;
  }

  const { text, totalCount, allFeminine, singleGender } = joinConflictItems(items);
  const verb = totalCount === 1 ? 'existe' : 'existem';
  const adjective =
    totalCount === 1
      ? singleGender === 'f'
        ? 'vinculada'
        : 'vinculado'
      : allFeminine
        ? 'vinculadas'
        : 'vinculados';

  return `Não é possível excluir: ${verb} ${text} ${adjective} ${target}.`;
}

export function formatSessionDeletionConflict(error: unknown): string | null {
  const details = extractDetails(error);
  if (!details) return null;
  const items = buildSessionConflictItems(details);
  const fallback = error instanceof Error && error.message ? error.message : null;
  return buildConflictMessage(items, 'a esta sessão', fallback);
}

export function formatProblemDeletionConflict(error: unknown): string | null {
  const details = extractDetails(error);
  if (!details) return null;
  const items = buildProblemConflictItems(details);
  const fallback = error instanceof Error && error.message ? error.message : null;
  return buildConflictMessage(items, 'a este problema', fallback);
}
