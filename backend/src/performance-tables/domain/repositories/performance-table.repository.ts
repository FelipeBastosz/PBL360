import type { PerformanceTable } from '../entities/performance-table.entity';

export const PERFORMANCE_TABLE_REPOSITORY = Symbol('PERFORMANCE_TABLE_REPOSITORY');

export enum PerformanceTableOrigin {
  TURMA = 'TURMA',
  PESSOAL = 'PESSOAL',
  PADRAO = 'PADRAO',
}

export interface PerformanceTableAuthor {
  id: string;
  nome: string;
}

export interface RoomPerformanceCriterionItem {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  peso: number;
  notaMaxima: number;
}

export interface RoomPerformanceTableItem {
  id: string;
  nome: string;
  descricao: string | null;
  origem: PerformanceTableOrigin;
  autor: PerformanceTableAuthor;
  criterios: RoomPerformanceCriterionItem[];
  emUso: number;
}

export interface PerformanceTableUsage {
  problemCount: number;
  sessionCount?: number;
  pastSessionCount?: number;
}

export interface PerformanceTableSummary {
  id: string;
  tutorId: string;
  roomId?: string | null;
  name: string;
  description: string | null;
  isDefault: boolean;
  criteriaCount: number;
  problemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceTableRepository {
  create(table: PerformanceTable): Promise<PerformanceTable>;
  findSummariesByTutorId(tutorId: string): Promise<PerformanceTableSummary[]>;
  findTablesByRoom(roomId: string, tutorId: string): Promise<RoomPerformanceTableItem[]>;
  findById(id: string): Promise<PerformanceTable | null>;
  softDelete(table: PerformanceTable): Promise<boolean>;
  update(table: PerformanceTable, propagateToSessions?: boolean): Promise<PerformanceTable>;
  findUsageById(id: string): Promise<PerformanceTableUsage>;
  findByIdIncludingDeleted(id: string): Promise<PerformanceTable | null>;
}
