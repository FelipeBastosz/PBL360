import type { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';

export type TableEditScope = 'SESSAO' | 'TODAS';

export interface TableEditCriterion {
  id?: string;
  name?: string;
  weight: number;
  maxScore?: number;
}

export interface SessionTableEditInput {
  sessionId: string;
  tutorId: string;
  scope: TableEditScope;
  name?: string;
  criteria: TableEditCriterion[];
}

export interface TableSessionUsage {
  sessionId: string;
  label: string;
  roomId: string;
  hasOccurred: boolean;
  canAccess: boolean;
}

export interface SessionTableEditContext {
  table: PerformanceTable;
  session: TableSessionUsage;
  sessions: TableSessionUsage[];
}

export interface SessionTableEditPlan {
  table: PerformanceTable;
  sessions: TableSessionUsage[];
  copy: boolean;
}

export interface SessionTableEditResult {
  table: { id: string; name: string };
  sessions: Array<{ sessionId: string; label: string }>;
}

export type PrepareSessionTableEdit = (context: SessionTableEditContext) => SessionTableEditPlan;

export interface SessionTableEditingRepository {
  getContext(sessionId: string, tutorId: string): Promise<SessionTableEditContext>;
  edit(
    input: SessionTableEditInput,
    prepare: PrepareSessionTableEdit,
  ): Promise<SessionTableEditResult>;
}

export const SESSION_TABLE_EDITING_REPOSITORY = Symbol('SessionTableEditingRepository');
