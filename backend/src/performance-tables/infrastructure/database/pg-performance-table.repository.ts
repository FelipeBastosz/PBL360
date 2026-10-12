import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { NotFoundError } from '@/shared/errors/application.error';
import { syncPerformanceCriteria } from './performance-criteria.persistence';
import { assertPastSessionUpdateAllowed } from './performance-table-update.validation';
import { propagatePerformanceTableSessions } from './performance-table-session.persistence';

import { PerformanceTable } from '../../domain/entities/performance-table.entity';
import type {
  PerformanceTableRepository,
  PerformanceTableSummary,
  PerformanceTableUsage,
  RoomPerformanceTableItem,
} from '../../domain/repositories/performance-table.repository';

import {
  type PerformanceTableDetailRow,
  toPerformanceTableWithCriteria,
} from './performance-table-detail.mapper';

import {
  type RoomPerformanceTableRow,
  toRoomPerformanceTableItems,
} from './room-performance-table.mapper';

import {
  FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
  PERFORMANCE_TABLE_SUMMARY_QUERY,
  UPDATE_PERFORMANCE_TABLE_QUERY,
  INSERT_PERFORMANCE_TABLE_QUERY,
  FIND_PERFORMANCE_TABLE_USAGE_QUERY,
  FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY,
  FIND_ROOM_PERFORMANCE_TABLES_QUERY,
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

  update(table: PerformanceTable, propagateToSessions = false): Promise<PerformanceTable> {
    return this.performanceTables.manager.transaction(async (manager) => {
      await this.lockTable(manager, table);
      await assertPastSessionUpdateAllowed(manager, table);
      await this.updateTable(manager, table);
      await syncPerformanceCriteria(manager, table);
      if (propagateToSessions) await propagatePerformanceTableSessions(manager, table);

      return this.readUpdatedTable(manager, table.id);
    });
  }

  async softDelete(table: PerformanceTable): Promise<boolean> {
    const rows = await this.performanceTables.query<{ id: string }[]>(
      `UPDATE performance_tables
          SET deleted_at = $2,
              updated_at = now()
        WHERE id = $1
          AND tutor_id = $3
          AND is_default = FALSE
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

  private async lockTable(manager: EntityManager, table: PerformanceTable): Promise<void> {
    const rows = await manager.query<{ id: string }[]>(
      `SELECT id FROM performance_tables
        WHERE id = $1 AND tutor_id = $2 AND deleted_at IS NULL FOR UPDATE;`,
      [table.id, table.tutorId],
    );
    if (rows.length === 0) {
      throw new NotFoundError('Tabela de desempenho não encontrada.');
    }
  }

  private async readUpdatedTable(manager: EntityManager, id: string): Promise<PerformanceTable> {
    const rows = await manager.query<PerformanceTableDetailRow[]>(
      FIND_PERFORMANCE_TABLE_BY_ID_QUERY,
      [id],
    );
    return toPerformanceTableWithCriteria(rows);
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

  async findTablesByRoom(roomId: string, tutorId: string): Promise<RoomPerformanceTableItem[]> {
    const rows = await this.performanceTables.query<RoomPerformanceTableRow[]>(
      FIND_ROOM_PERFORMANCE_TABLES_QUERY,
      [roomId, tutorId],
    );

    return toRoomPerformanceTableItems(rows, roomId);
  }

  private async insertTable(
    manager: EntityManager,
    table: PerformanceTable,
  ): Promise<PerformanceTable> {
    const [persistedTable] = await manager.query<PerformanceTable[]>(
      INSERT_PERFORMANCE_TABLE_QUERY,
      [table.tutorId, table.roomId ?? null, table.name, table.description, table.isDefault],
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

  async findUsageById(id: string): Promise<PerformanceTableUsage> {
    const [usage] = await this.performanceTables.query<PerformanceTableUsage[]>(
      FIND_PERFORMANCE_TABLE_USAGE_QUERY,
      [id],
    );

    return usage
      ? {
          problemCount: Number(usage.problemCount ?? 0),
          sessionCount: Number(usage.sessionCount ?? 0),
          pastSessionCount: Number(usage.pastSessionCount ?? 0),
        }
      : { problemCount: 0, sessionCount: 0, pastSessionCount: 0 };
  }

  async findByIdIncludingDeleted(id: string): Promise<PerformanceTable | null> {
    const rows = await this.performanceTables.query<PerformanceTableDetailRow[]>(
      FIND_PERFORMANCE_TABLE_BY_ID_INCLUDING_DELETED_QUERY,
      [id],
    );

    return rows.length > 0 ? toPerformanceTableWithCriteria(rows) : null;
  }
}
