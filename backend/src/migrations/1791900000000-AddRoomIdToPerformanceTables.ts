import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoomIdToPerformanceTables1791900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_tables
        ADD COLUMN room_id UUID DEFAULT NULL,
        ADD CONSTRAINT fk_performance_tables_room
          FOREIGN KEY (room_id)
          REFERENCES rooms(id)
          ON DELETE CASCADE;

      CREATE INDEX idx_performance_tables_room_id
        ON performance_tables(room_id);

      -- Backfill room_id a partir dos problemas que utilizam a tabela (tabelas não-padrão)
      UPDATE performance_tables pt
         SET room_id = sub.room_id
        FROM (
          SELECT DISTINCT ON (p.performance_table_id)
                 p.performance_table_id,
                 p.room_id
            FROM problems p
           WHERE p.performance_table_id IS NOT NULL
           ORDER BY p.performance_table_id, p.created_at ASC
        ) sub
       WHERE pt.id = sub.performance_table_id
         AND pt.room_id IS NULL
         AND pt.is_default = FALSE;

      -- Backfill a partir de sessões/avaliações que utilizam a tabela
      UPDATE performance_tables pt
         SET room_id = sub.room_id
        FROM (
          SELECT DISTINCT ON (sec.performance_table_id)
                 sec.performance_table_id,
                 p.room_id
            FROM session_evaluation_configs sec
            JOIN sessions s ON s.id = sec.session_id
            JOIN problems p ON p.id = s.problem_id
           WHERE sec.performance_table_id IS NOT NULL
           ORDER BY sec.performance_table_id, s.created_at ASC
        ) sub
       WHERE pt.id = sub.performance_table_id
         AND pt.room_id IS NULL
         AND pt.is_default = FALSE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_performance_tables_room_id;

      ALTER TABLE performance_tables
        DROP CONSTRAINT IF EXISTS fk_performance_tables_room,
        DROP COLUMN IF EXISTS room_id;
    `);
  }
}
