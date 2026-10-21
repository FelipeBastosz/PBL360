import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';

export function isTableApplied(
  table: PerformanceTableSummary | PerformanceTable | null,
  config: SessionEvaluationConfig | null,
): boolean {
  if (!table || !config?.tabela) return false;

  if (config.tabela.id === table.id) return true;

  const sessionName = (config.tabela.nome ?? '').trim().toLowerCase();
  const tableName = (table.nome ?? '').trim().toLowerCase();

  if (!sessionName || !tableName) return false;

  if (sessionName === tableName) return true;

  const baseSessionName = sessionName.split(' — ')[0]?.trim();
  return Boolean(baseSessionName && baseSessionName === tableName);
}
