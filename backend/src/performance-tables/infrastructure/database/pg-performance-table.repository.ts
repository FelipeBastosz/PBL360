import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';

import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type {
  PerformanceTableRepository,
  PerformanceTableSummary,
} from '../../domain/repositories/performance-table.repository';

import {
  type PerformanceTableDetailRow,
  toPerformanceTableWithCriteria,
} from './performance-table-detail.mapper';

import {
  ARCHIVE_PERFORMANCE_CRITERIA_QUERY,
  FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
  PERFORMANCE_TABLE_SUMMARY_QUERY,
  UPDATE_PERFORMANCE_TABLE_QUERY,
  INSERT_PERFORMANCE_TABLE_QUERY,
} from './performance-table.queries';

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

      const persistedCriteria = await this.insertCriteria(manager, persistedTable.id, table);

      this.assignPersistedCriteriaIds(table, persistedCriteria);

      return Object.assign(new PerformanceTable(), persistedTable, {
        criteria: table.criteria,
      });
    });
  }

  update(table: PerformanceTable): Promise<PerformanceTable> {
    return this.performanceTables.manager.transaction(async (manager) => {
      await this.updateTable(manager, table);
      await this.archiveCurrentCriteria(manager, table.id);

      const persistedCriteria = await this.insertCriteria(manager, table.id, table);

      this.assignPersistedCriteriaIds(table, persistedCriteria);
      table.updatedAt = new Date();

      return table;
    });
  }

  async softDelete(table: PerformanceTable): Promise<boolean> {
    const rows = await this.performanceTables.query<{ id: string }[]>(
      `UPDATE performance_tables
          SET deleted_at = $2,
              updated_at = now()
        WHERE id = $1
          AND tutor_id = $3
          AND deleted_at IS NULL
        RETURNING id;`,
      [table.id, table.deletedAt, table.tutorId],
    );

    return rows.length > 0;
  }

  findSummariesByTutorId(tutorId: string): Promise<PerformanceTableSummary[]> {
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

    return rows.length > 0 ? toPerformanceTableWithCriteria(rows) : null;
  }

  private async updateTable(manager: EntityManager, table: PerformanceTable): Promise<void> {
    await manager.query(UPDATE_PERFORMANCE_TABLE_QUERY, [table.id, table.name, table.description]);
  }

  private async archiveCurrentCriteria(manager: EntityManager, tableId: string): Promise<void> {
    await manager.query(ARCHIVE_PERFORMANCE_CRITERIA_QUERY, [tableId]);
  }

  private assignPersistedCriteriaIds(
    table: PerformanceTable,
    persistedCriteria: Array<{ id: string }>,
  ): void {
    table.criteria.forEach((criterion, index) => {
      criterion.id = persistedCriteria[index]!.id;
      criterion.performanceTableId = table.id;
    });
  }

  private async insertTable(
    manager: EntityManager,
    table: PerformanceTable,
  ): Promise<PerformanceTable> {
    const [persistedTable] = await manager.query<PerformanceTable[]>(
      INSERT_PERFORMANCE_TABLE_QUERY,
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
      `INSERT INTO performance_criteria (
         performance_table_id,
         name,
         description,
         order_index,
         weight
       )
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
