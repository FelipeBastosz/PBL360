import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type { PerformanceTableRepository } from '../../domain/repositories/performance-table.repository';

const CRITERION_COLUMNS = 5;

@Injectable()
export class PgPerformanceTableRepository implements PerformanceTableRepository {
  constructor(
    @InjectRepository(PerformanceTable)
    private readonly performanceTables: Repository<PerformanceTable>,
  ) {}

  create(table: PerformanceTable): Promise<PerformanceTable> {
    return this.performanceTables.manager.transaction(async (manager) => {
      const persistedTable = await this.insertTable(manager, table);
      await this.insertCriteria(manager, persistedTable.id, table);

      return Object.assign(new PerformanceTable(), persistedTable, {
        criteria: table.criteria,
      });
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
  ): Promise<unknown> {
    const criteria = this.buildCriteriaValues(tableId, table);
    const placeholders = this.buildCriteriaPlaceholders(criteria.length);

    return manager.query(
      `INSERT INTO performance_criteria
         (performance_table_id, name, description, order_index, weight)
       VALUES ${placeholders};`,
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
