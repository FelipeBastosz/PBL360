import type { Criterion, CriterionInput, PerformanceTable } from '@/types/performanceTable';
import type {
  SessionEvaluationConfig,
  SessionTableCriterion,
  SessionTableEditPermissions,
} from '@/types/session';

const PAST_SESSION_LOCK_REASON = 'Esta tabela já foi usada em sessões que aconteceram';

export function buildPastSessionPermissions(
  table: PerformanceTable,
): SessionTableEditPermissions | null {
  if ((table.quantidadeSessoesPassadas ?? 0) <= 0) return null;
  return {
    podeEditarCriterios: false,
    motivo: PAST_SESSION_LOCK_REASON,
    sessoesQueUsam: [],
  };
}

function matchBaseCriterion(
  baseCriteria: CriterionInput[],
  sessionCriterion: SessionTableCriterion,
  index: number,
): CriterionInput | undefined {
  const normalizedName = sessionCriterion.nome.trim().toLowerCase();
  return (
    baseCriteria.find((c) => c.id === sessionCriterion.id) ??
    baseCriteria.find((c) => c.nome.trim().toLowerCase() === normalizedName) ??
    baseCriteria[index]
  );
}

export function reconcileSessionCriteria(
  baseCriteria: CriterionInput[],
  sessionCriteria?: SessionTableCriterion[],
): Criterion[] {
  if (!sessionCriteria?.length) {
    return baseCriteria.map((c) => ({ ...c, id: c.id ?? '', descricao: c.descricao ?? null }));
  }
  return sessionCriteria.map((sc, index) => {
    const match = matchBaseCriterion(baseCriteria, sc, index);
    return {
      id: sc.id,
      nome: sc.nome,
      descricao: match?.descricao ?? null,
      peso: sc.peso,
      ordem: match?.ordem ?? index + 1,
    };
  });
}

export function mergeTableWithSessionConfig(
  baseTable: PerformanceTable,
  sessionTable: PerformanceTable | null,
  config: SessionEvaluationConfig | null,
): PerformanceTable {
  const mergedSource = sessionTable ?? baseTable;
  const enrichedCriteria = mergedSource.criterios.map((c, index) => ({
    ...c,
    descricao: c.descricao ?? baseTable.criterios[index]?.descricao ?? null,
  }));
  return {
    ...mergedSource,
    nome: config?.tabela?.nome || mergedSource.nome,
    descricao: mergedSource.descricao ?? baseTable.descricao,
    criterios: reconcileSessionCriteria(enrichedCriteria, config?.tabela?.criterios),
  };
}
