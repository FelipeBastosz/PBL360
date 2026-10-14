import { SYSTEM_TABLE_IDS } from '@/performance-tables/domain/entities/system-performance-tables';

export interface DefaultTableSession {
  id: string;
  date: string;
  orderIndex: number;
  performanceTableId: string;
  usesDefaultTable: boolean;
}

export function selectDefaultTable(
  sessions: readonly DefaultTableSession[],
  target: Pick<DefaultTableSession, 'id' | 'date' | 'orderIndex'>,
): string {
  const first = [...sessions.filter((session) => session.id !== target.id), target].sort(
    compareSessions,
  )[0];
  return first?.id === target.id ? SYSTEM_TABLE_IDS.firstSession : SYSTEM_TABLE_IDS.standard;
}

export function planDefaultSessionTables(
  sessions: readonly DefaultTableSession[],
  hasEvaluations: boolean,
): Array<{ sessionId: string; tableId: string }> {
  if (hasEvaluations) return [];
  return sessions.flatMap((session) => {
    const tableId = selectDefaultTable(sessions, session);
    return session.usesDefaultTable && tableId !== session.performanceTableId
      ? [{ sessionId: session.id, tableId }]
      : [];
  });
}

function compareSessions(
  left: Pick<DefaultTableSession, 'id' | 'date' | 'orderIndex'>,
  right: Pick<DefaultTableSession, 'id' | 'date' | 'orderIndex'>,
): number {
  return (
    left.date.localeCompare(right.date) ||
    left.orderIndex - right.orderIndex ||
    left.id.localeCompare(right.id)
  );
}
