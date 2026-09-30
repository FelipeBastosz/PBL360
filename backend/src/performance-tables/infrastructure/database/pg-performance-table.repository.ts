import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
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

  async findById(id: string): Promise<PerformanceTable | null> {
    const [table] = await this.performanceTables.query<PerformanceTable[]>(
      `SELECT id, tutor_id AS "tutorId", name, description, created_at AS "createdAt",
              updated_at AS "updatedAt", deleted_at AS "deletedAt"
         FROM performance_tables
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1;`,
      [id],
    );

    return table ? Object.assign(new PerformanceTable(), table) : null;
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
