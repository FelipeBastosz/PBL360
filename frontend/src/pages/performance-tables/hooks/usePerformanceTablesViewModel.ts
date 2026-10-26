import { useMemo, useCallback } from 'react';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import { isTableApplied } from '../utils/isTableApplied';

type ViewModelInput = {
  tables: PerformanceTableSummary[];
  sessionConfig: SessionEvaluationConfig | null;
  externalAppliedTable: PerformanceTableSummary | null;
  query: string;
  isRoomContext: boolean;
  currentUserId?: string;
  userName?: string;
};

function resolveAuthor(
  sys: boolean,
  ext: PerformanceTableSummary | null,
  cat?: PerformanceTableSummary,
  authId?: string | null,
  user?: { id?: string; name?: string },
) {
  if (sys) return 'Sistema';
  if (ext?.autor?.nome) return ext.autor.nome;
  if (cat?.autor?.nome && cat.autor.nome !== 'Sistema') return cat.autor.nome;
  const id = authId ?? cat?.autor?.id;
  if (id && user?.id && id === user.id && user.name) return user.name;
  return 'Professor da turma';
}

function buildAppliedTable(
  cfg: SessionEvaluationConfig['tabela'],
  authId: string | undefined | null,
  name: string,
  cat?: PerformanceTableSummary,
  ext?: PerformanceTableSummary | null,
): PerformanceTableSummary {
  return {
    id: cfg.id,
    nome: cfg.nome,
    descricao:
      cat?.descricao ?? ext?.descricao ?? 'Fórmula aplicada e em uso nas sessões desta turma.',
    quantidadeCriterios: cfg.criterios?.length ?? 0,
    origem: 'TURMA',
    autor: { id: authId ?? cat?.autor?.id ?? null, nome: name },
    emUso: ext?.emUso ?? cat?.emUso ?? 1,
  };
}

function injectAppliedTable(input: ViewModelInput, sys: boolean, match?: PerformanceTableSummary) {
  const tables = input.tables ?? [];
  if (!input.sessionConfig?.tabela || sys) return tables;
  const authorId = input.externalAppliedTable?.autor?.id;

  const alreadyInRoom = tables.some(
    (t) =>
      (t.origem === 'TURMA' || t.id === input.sessionConfig?.tabela.id) &&
      isTableApplied(t, input.sessionConfig, authorId),
  );
  if (alreadyInRoom) return tables;

  const authorName = resolveAuthor(sys, input.externalAppliedTable, match, authorId, {
    id: input.currentUserId,
    name: input.userName,
  });
  const appliedRoomTable = buildAppliedTable(
    input.sessionConfig.tabela,
    authorId,
    authorName,
    match,
    input.externalAppliedTable,
  );

  return [appliedRoomTable, ...tables];
}

function groupSections(
  tables: PerformanceTableSummary[],
  isRoomContext: boolean,
  currentUserId?: string,
) {
  if (!isRoomContext) return null;
  return {
    padrao: tables.filter((t) => t.origem === 'PADRAO'),
    turma: tables.filter((t) => t.origem === 'TURMA'),
    minhas: tables.filter(
      (t) => t.origem === 'PESSOAL' && (t.autor?.id === currentUserId || !t.autor?.id),
    ),
  };
}

export function usePerformanceTablesViewModel(input: ViewModelInput) {
  const appliedAuthorId = input.externalAppliedTable?.autor?.id;

  const catalogMatch = useMemo(
    () => (input.tables ?? []).find((t) => isTableApplied(t, input.sessionConfig, appliedAuthorId)),
    [input.tables, input.sessionConfig, appliedAuthorId],
  );

  const isSystemApplied = Boolean(
    input.sessionConfig?.tabela.padrao || catalogMatch?.origem === 'PADRAO',
  );

  const allTables = useMemo(
    () => injectAppliedTable(input, isSystemApplied, catalogMatch),
    [input, isSystemApplied, catalogMatch],
  );

  const safeQuery = input.query ?? '';
  const filtered = useMemo(
    () => allTables.filter((t) => t.nome.toLowerCase().includes(safeQuery.toLowerCase())),
    [allTables, safeQuery],
  );

  const sections = useMemo(
    () => groupSections(filtered, input.isRoomContext, input.currentUserId),
    [filtered, input.isRoomContext, input.currentUserId],
  );

  const checkApplied = useCallback(
    (table: PerformanceTableSummary) => {
      if (table.origem === 'PESSOAL') return false;
      return isTableApplied(table, input.sessionConfig, appliedAuthorId);
    },
    [input.sessionConfig, appliedAuthorId],
  );

  return { filtered, sections, checkApplied };
}
