import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  SessionTableEditingRepository,
  SessionTableEditInput,
  PrepareSessionTableEdit,
} from '../../domain/repositories/session-table-editing.repository';
import { lockSessionPerformanceTable } from './session-table-lock.persistence';
import { readTableEditContext } from './session-table-editing.reads';
import { persistSessionTableEdit } from './session-table-editing.persistence';

@Injectable()
export class PgSessionTableEditingRepository implements SessionTableEditingRepository {
  constructor(private readonly dataSource: DataSource) {}

  getContext(sessionId: string, tutorId: string) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      readTableEditContext(manager, sessionId, tutorId),
    );
  }

  edit(input: SessionTableEditInput, prepare: PrepareSessionTableEdit) {
    return this.dataSource.transaction(async (manager) => {
      const tableId = await lockSessionPerformanceTable(manager, input.sessionId, true);
      await manager.query(
        `SELECT id FROM sessions WHERE performance_table_id = $1
          AND (id = $2 OR NOT EXISTS (SELECT 1 FROM performance_tables WHERE id = $1 AND is_default = TRUE))
          ORDER BY id FOR UPDATE;`,
        [tableId, input.sessionId],
      );
      const context = await readTableEditContext(manager, input.sessionId, input.tutorId);
      return persistSessionTableEdit(manager, prepare(context));
    });
  }
}
