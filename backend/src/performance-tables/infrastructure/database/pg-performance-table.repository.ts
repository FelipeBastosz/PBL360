import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { PerformanceCriterion } from '../../domain/entities/performance-criterion.entity';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type {
  PerformanceTableRepository,
  PerformanceTableSummary,
} from '../../domain/repositories/performance-table.repository';

const CRITERION_COLUMNS = 5;

const PERFORMANCE_TABLE_SUMMARY_QUERY = `SELECT performance_tables.id,
              performance_tables.tutor_id AS "tutorId",
              performance_tables.name,
              performance_tables.description,
              COUNT(DISTINCT performance_criteria.id)::int AS "criteriaCount",
              COUNT(DISTINCT problems.id)::int AS "problemCount",
              performance_tables.created_at AS "createdAt",
              performance_tables.updated_at AS "updatedAt"
         FROM performance_tables
         LEFT JOIN performance_criteria
           ON performance_criteria.performance_table_id = performance_tables.id
          AND performance_criteria.deleted_at IS NULL
         LEFT JOIN problems
           ON problems.performance_table_id = performance_tables.id
        WHERE performance_tables.tutor_id = $1
          AND performance_tables.deleted_at IS NULL
        GROUP BY performance_tables.id
        ORDER BY performance_tables.created_at ASC, performance_tables.id ASC;`;

interface PerformanceTableDetailRow {
  id: string;
  tutorId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  problemCount: number;
  criterionId: string | null;
  criterionName: string | null;
  criterionDescription: string | null;
  criterionOrderIndex: number | null;
  criterionWeight: string | number | null;
}

const FIND_PERFORMANCE_TABLE_BY_ID_QUERY = `SELECT pt.id,
              pt.tutor_id AS "tutorId",
              pt.name,
              pt.description,
              pt.created_at AS "createdAt",
              pt.updated_at AS "updatedAt",
              pt.deleted_at AS "deletedAt",
              (SELECT COUNT(*)::int FROM problems p WHERE p.performance_table_id = pt.id) AS "problemCount",
              pc.id AS "criterionId",
              pc.name AS "criterionName",
              pc.description AS "criterionDescription",
              pc.order_index AS "criterionOrderIndex",
              pc.weight AS "criterionWeight"
         FROM performance_tables pt
         LEFT JOIN performance_criteria pc
           ON pc.performance_table_id = pt.id
          AND pc.deleted_at IS NULL
        WHERE pt.id = $1
          AND pt.deleted_at IS NULL
        ORDER BY pc.order_index ASC, pc.created_at ASC;`;

@Injectable()
export class PgPerformanceTableRepository implements PerformanceTableRepository {
  constructor(
    @InjectRepository(PerformanceTable)
    private readonly performanceTables: Repository<PerformanceTable>,
  ) {}

  create(table: PerformanceTable): Promise<PerformanceTable> {
    return this.performanceTables.manager.transaction(async (manager) => {
      const persistedTable = await this.insertTable(manager, table);
      const persistedCriteria = await this.insertCriteria(manager, persistedTable.id, table);
      table.criteria.forEach((criterion, index) => {
        criterion.id = persistedCriteria[index]!.id;
      });

      return Object.assign(new PerformanceTable(), persistedTable, {
        criteria: table.criteria,
      });
    });
  }

  async softDelete(table: PerformanceTable): Promise<boolean> {
    const rows = await this.performanceTables.query<{ id: string }[]>(
      `UPDATE performance_tables
          SET deleted_at = $2, updated_at = now()
        WHERE id = $1 AND tutor_id = $3 AND deleted_at IS NULL
        RETURNING id;`,
      [table.id, table.deletedAt, table.tutorId],
    );

    return rows.length > 0;
  }

  async findSummariesByTutorId(tutorId: string): Promise<PerformanceTableSummary[]> {
    return this.performanceTables.query<PerformanceTableSummary[]>(
      PERFORMANCE_TABLE_SUMMARY_QUERY,
      [tutorId],
    );
  }

  async findById(id: string): Promise<PerformanceTable | null> {
    const rows = await this.performanceTables.query<PerformanceTableDetailRow[]>(
      FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
      [id],
    );

    return rows.length > 0 ? this.toPerformanceTableWithCriteria(rows) : null;
  }

  private toPerformanceTableWithCriteria(rows: PerformanceTableDetailRow[]): PerformanceTable {
    const first = rows[0]!;
    const table = new PerformanceTable();
    table.id = first.id;
    table.tutorId = first.tutorId;
    table.name = first.name;
    table.description = first.description;
    table.createdAt = first.createdAt;
    table.updatedAt = first.updatedAt;
    table.deletedAt = first.deletedAt;
    table.problemCount = Number(first.problemCount ?? 0);
    table.criteria = this.extractCriteriaFromRows(rows, table);

    return table;
  }

  private extractCriteriaFromRows(
    rows: PerformanceTableDetailRow[],
    table: PerformanceTable,
  ): PerformanceCriterion[] {
    return rows
      .filter((r) => r.criterionId !== null)
      .map((r) => {
        const criterion = new PerformanceCriterion();
        criterion.id = r.criterionId!;
        criterion.performanceTableId = table.id;
        criterion.name = r.criterionName!;
        criterion.description = r.criterionDescription;
        criterion.orderIndex = Number(r.criterionOrderIndex);
        criterion.weight = Number(r.criterionWeight);
        criterion.performanceTable = table;
        return criterion;
      });
  }

  private async insertTable(
    manager: EntityManager,
    table: PerformanceTable,
  ): Promise<PerformanceTable> {
    const [persistedTable] = await manager.query<PerformanceTable[]>(
      `INSERT INTO performance_tables (tutor_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, tutor_id AS "tutorId", name, description, created_at AS "createdAt",
                   updated_at AS "updatedAt", deleted_at AS "deletedAt";`,
      [table.tutorId, table.name, table.description],
    );

    if (!persistedTable) {
      throw new Error('Failed to persist performance table.');
    }

    return persistedTable;
  }

  private insertCriteria(
    manager: EntityManager,
    tableId: string,
    table: PerformanceTable,
  ): Promise<Array<{ id: string }>> {
    const criteria = this.buildCriteriaValues(tableId, table);
    const placeholders = this.buildCriteriaPlaceholders(criteria.length);

    return manager.query<Array<{ id: string }>>(
      `INSERT INTO performance_criteria
         (performance_table_id, name, description, order_index, weight)
       VALUES ${placeholders}
       RETURNING id;`,
      criteria.flat(),
    );
  }

  private buildCriteriaValues(tableId: string, table: PerformanceTable) {
    return table.criteria.map((criterion) => [
      tableId,
      criterion.name,
      criterion.description ?? null,
      criterion.orderIndex,
      criterion.weight,
    ]);
  }

  private buildCriteriaPlaceholders(criteriaCount: number): string {
    return Array.from({ length: criteriaCount }, (_, criterionIndex) => {
      const offset = criterionIndex * CRITERION_COLUMNS;
      const placeholders = Array.from(
        { length: CRITERION_COLUMNS },
        (_, column) => `$${offset + column + 1}`,
      );
      return `(${placeholders.join(', ')})`;
    }).join(', ');
  }
}
