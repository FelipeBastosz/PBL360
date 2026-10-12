import type { DataSource } from 'typeorm';
import { SYSTEM_PERFORMANCE_TABLES } from '@/performance-tables/domain/entities/system-performance-tables';

export async function insertSystemPerformanceTables(db: DataSource): Promise<void> {
  for (const table of SYSTEM_PERFORMANCE_TABLES) {
    const inserted = await db.query<Array<{ id: string }>>(
      `INSERT INTO performance_tables (id, tutor_id, name, is_default)
       VALUES ($1, NULL, $2, TRUE) ON CONFLICT (id) DO NOTHING RETURNING id;`,
      [table.id, table.name],
    );
    if (inserted.length === 0) continue;
    for (const [index, criterion] of table.criteria.entries()) {
      await db.query(
        `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight, max_score)
         VALUES ($1, $2, $3, $4, 10);`,
        [table.id, criterion.name, index + 1, criterion.weight],
      );
    }
  }
}
