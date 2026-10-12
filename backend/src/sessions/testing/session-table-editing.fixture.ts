import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import type {
  SessionTableEditContext,
  SessionTableEditInput,
  TableEditScope,
} from '../domain/repositories/session-table-editing.repository';

export function tableEditContext(occurred = false): SessionTableEditContext {
  const table = createTable();
  const session = sessionUsage('session', 'P1S2', 'room', false);
  const other = sessionUsage('other', 'P2S1', 'other-room', occurred);
  return { table, session, sessions: [session, other] };
}

function createTable(): PerformanceTable {
  const table = PerformanceTable.create({
    tutorId: 'owner',
    name: 'Barema',
    description: 'Descrição mantida',
    criteria: [
      { name: 'Participação', weight: 5 },
      { name: 'Postura', weight: 5 },
    ],
  });
  table.id = 'table';
  table.criteria.forEach((criterion, index) => {
    criterion.id = `criterion-${index}`;
  });
  return table;
}

function sessionUsage(sessionId: string, label: string, roomId: string, hasOccurred: boolean) {
  return { sessionId, label, roomId, hasOccurred, canAccess: true };
}

export function tableEditInput(scope: TableEditScope = 'TODAS'): SessionTableEditInput {
  return {
    sessionId: 'session',
    tutorId: 'tutor',
    scope,
    criteria: [
      { id: 'criterion-0', name: 'Participação', weight: 8, maxScore: 10 },
      { id: 'criterion-1', name: 'Postura', weight: 2, maxScore: 10 },
    ],
  };
}
