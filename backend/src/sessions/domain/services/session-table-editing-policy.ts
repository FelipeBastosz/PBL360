import {
  ConflictError,
  ForbiddenError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { PerformanceTable } from '@/performance-tables/domain/entities/performance-table.entity';
import { InvalidPerformanceTableError } from '@/performance-tables/domain/errors/invalid-performance-table.error';
import type {
  SessionTableEditContext,
  SessionTableEditInput,
  SessionTableEditPlan,
  TableEditCriterion,
  TableSessionUsage,
} from '../repositories/session-table-editing.repository';

export const WEIGHTS_ONLY_REASON =
  'A tabela possui sessão de hoje, anterior ou com avaliação do tutor enviada. Somente os pesos podem ser alterados.';

export function canEditTableCriteria(context: SessionTableEditContext): boolean {
  return !context.sessions.some((session) => session.hasOccurred);
}

export function assertTableSessionsAccessible(sessions: TableSessionUsage[]): void {
  if (sessions.some((session) => !session.canAccess)) {
    throw new ForbiddenError('Você não tem permissão para acessar todas as salas afetadas.');
  }
}

export function prepareSessionTableEdit(
  context: SessionTableEditContext,
  input: SessionTableEditInput,
): SessionTableEditPlan {
  const sessions = input.scope === 'SESSAO' ? [context.session] : context.sessions;
  assertTableSessionsAccessible(sessions);
  assertCriterionIds(context, input.criteria);
  input.criteria.forEach(assertEditNumbers);
  const editable = canEditTableCriteria(context);
  if (!editable) assertWeightsOnly(context.table, input);
  const table = buildCandidate(context, input, editable);
  return { table, sessions, copy: input.scope === 'SESSAO' };
}

function assertCriterionIds(
  context: SessionTableEditContext,
  criteria: TableEditCriterion[],
): void {
  const ids = criteria.flatMap((criterion) => (criterion.id === undefined ? [] : [criterion.id]));
  const currentIds = new Set(context.table.criteria.map((criterion) => criterion.id));
  if (new Set(ids).size !== ids.length || ids.some((id) => !currentIds.has(id))) {
    throw new UnprocessableEntityError('Há critérios repetidos ou que não pertencem à tabela.');
  }
}

function assertWeightsOnly(table: PerformanceTable, input: SessionTableEditInput): void {
  if (input.name !== undefined || input.criteria.length !== table.criteria.length) {
    throw new ConflictError(WEIGHTS_ONLY_REASON);
  }
  const existing = new Map(table.criteria.map((criterion) => [criterion.id, criterion]));
  for (const criterion of input.criteria) {
    const previous = criterion.id ? existing.get(criterion.id) : undefined;
    if (!previous || (criterion.name !== undefined && criterion.name !== previous.name)) {
      throw new ConflictError(WEIGHTS_ONLY_REASON);
    }
  }
}

function buildCandidate(
  context: SessionTableEditContext,
  input: SessionTableEditInput,
  editable: boolean,
): PerformanceTable {
  try {
    return createCandidate(context, input, editable);
  } catch (error) {
    if (error instanceof InvalidPerformanceTableError)
      throw new UnprocessableEntityError(error.message);
    throw error;
  }
}

function createCandidate(
  context: SessionTableEditContext,
  input: SessionTableEditInput,
  editable: boolean,
): PerformanceTable {
  const table = PerformanceTable.create({
    tutorId: input.scope === 'SESSAO' ? input.tutorId : context.table.tutorId,
    roomId: input.scope === 'SESSAO' ? context.session.roomId : context.table.roomId,
    name: resolveName(context, input),
    description: context.table.description,
    criteria: input.criteria.map((criterion, index) =>
      criterionValues(context, criterion, index, editable),
    ),
  });
  table.id = context.table.id;
  table.criteria.forEach((criterion, index) => {
    criterion.id = input.criteria[index]!.id!;
  });
  return table;
}

function criterionValues(
  context: SessionTableEditContext,
  criterion: TableEditCriterion,
  index: number,
  editable: boolean,
) {
  const previous = context.table.criteria.find((item) => item.id === criterion.id);
  assertCriterionFields(criterion, editable);
  return {
    name: criterion.name ?? previous!.name,
    description: previous?.description ?? null,
    weight: criterion.weight,
    orderIndex: editable ? index + 1 : previous!.orderIndex,
  };
}

function assertCriterionFields(criterion: TableEditCriterion, editable: boolean): void {
  if (editable && criterion.name === undefined) {
    throw new UnprocessableEntityError('Informe nome e peso de cada critério.');
  }
  assertNumericPrecision(criterion.weight);
}

function assertEditNumbers(criterion: TableEditCriterion): void {
  assertNumericPrecision(criterion.weight);
  if (criterion.weight < 0 || criterion.weight > 10) {
    throw new UnprocessableEntityError('O peso do critério deve estar entre 0 e 10.');
  }
}

function assertNumericPrecision(value: number): void {
  if (!Number.isFinite(value) || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    throw new UnprocessableEntityError('Pesos devem ter até duas casas decimais.');
  }
}

function resolveName(context: SessionTableEditContext, input: SessionTableEditInput): string {
  const name = input.name === undefined ? context.table.name : input.name.trim();
  if (!name || name.length > 120)
    throw new UnprocessableEntityError('Informe um nome de até 120 caracteres.');
  if (input.scope === 'TODAS') return name;
  const suffix = ` — ${context.session.label.slice(0, 80)}`;
  return `${name.slice(0, Math.max(1, 120 - suffix.length)).trimEnd()}${suffix}`;
}
