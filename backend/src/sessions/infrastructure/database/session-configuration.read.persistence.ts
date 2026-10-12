import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import type { EntityManager } from 'typeorm';
import type { SessionEvaluationCriterion } from '@/evaluations/domain/entities/session-evaluation-criterion.entity';
import type { SessionEvaluationConfig } from '@/evaluations/domain/entities/session-evaluation-config.entity';
import type {
  SessionCriterionRow,
  SessionTableRow,
} from './session-table-configuration.persistence';
import { readSessionFormula } from './session-formula-configuration.persistence';

export async function readSessionTable(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionTableRow> {
  const [table] = await manager.query<SessionTableRow[]>(
    `SELECT pt.id, pt.name, pt.is_default AS "isDefault"
       FROM sessions s
       JOIN performance_tables pt ON pt.id = s.performance_table_id
      WHERE s.id = $1 AND pt.deleted_at IS NULL;`,
    [sessionId],
  );
  if (!table) throw new NotFoundError('A tabela de desempenho da sessão não foi encontrada.');
  return table;
}

export function readTableCriteria(
  manager: EntityManager,
  tableId: string,
): Promise<SessionCriterionRow[]> {
  return manager.query<SessionCriterionRow[]>(
    `SELECT id, name, description, weight, max_score AS "maxScore", order_index AS "orderIndex"
       FROM performance_criteria
      WHERE performance_table_id = $1 AND deleted_at IS NULL
      ORDER BY order_index, created_at, id;`,
    [tableId],
  );
}

export async function readSessionConfiguration(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionEvaluationConfig> {
  const table = await readSessionTable(manager, sessionId);
  const criteria = await readTableCriteria(manager, table.id);
  if (criteria.length === 0) {
    throw new UnprocessableEntityError('A tabela vinculada não possui critérios ativos.');
  }
  return {
    tableId: table.id,
    tableName: table.name,
    criteria: criteria.map(toCriterion),
    frozen: false,
    formula: toEvaluationFormula(await readSessionFormula(manager, sessionId)),
  };
}

export function toEvaluationFormula(rows: Array<{ type: string; weight: string | number }>): {
  criteriaWeight: number;
  roleWeight: number;
} {
  const criteriaWeight = rows.find((row) => row.type === 'CRITERIOS')?.weight;
  const roleWeight = rows.find((row) => row.type === 'PAPEL')?.weight;
  if (criteriaWeight === undefined || roleWeight === undefined) {
    throw new UnprocessableEntityError('A fórmula ativa da sessão está incompleta.');
  }
  return { criteriaWeight: Number(criteriaWeight), roleWeight: Number(roleWeight) };
}

function toCriterion(row: SessionCriterionRow): SessionEvaluationCriterion {
  return {
    ...row,
    weight: Number(row.weight),
    maxScore: Number(row.maxScore ?? 10),
  };
}
