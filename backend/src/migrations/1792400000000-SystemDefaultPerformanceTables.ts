import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemDefaultPerformanceTables1792400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE system_default_table_migration_backup AS
        SELECT id FROM performance_tables WHERE is_default = TRUE;
      UPDATE performance_tables SET is_default = FALSE WHERE is_default = TRUE;
      DROP INDEX IF EXISTS uq_performance_tables_tutor_default;
      ALTER TABLE performance_tables ALTER COLUMN tutor_id DROP NOT NULL;
      ALTER TABLE performance_tables ADD CONSTRAINT ck_system_performance_table_owner CHECK (
        (is_default = FALSE AND tutor_id IS NOT NULL) OR
        (is_default = TRUE AND tutor_id IS NULL AND room_id IS NULL AND deleted_at IS NULL
         AND id IN ('34200000-0000-4000-8000-000000000001', '34200000-0000-4000-8000-000000000002'))
      );
      INSERT INTO performance_tables (id, tutor_id, name, is_default)
      VALUES ('34200000-0000-4000-8000-000000000001', NULL, 'Padrão', TRUE),
             ('34200000-0000-4000-8000-000000000002', NULL, 'Padrão da 1ª sessão', TRUE);
      INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
      VALUES ('34200000-0000-4000-8000-000000000001', 'Seguimento', 1, 4),
             ('34200000-0000-4000-8000-000000000001', 'Participação', 2, 4),
             ('34200000-0000-4000-8000-000000000001', 'Comportamento', 3, 2),
             ('34200000-0000-4000-8000-000000000002', 'Participação', 1, 8),
             ('34200000-0000-4000-8000-000000000002', 'Comportamento', 2, 2);
      ALTER TABLE sessions ADD COLUMN uses_default_table BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE OR REPLACE FUNCTION assign_session_performance_table() RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.performance_table_id IS NULL THEN
          PERFORM id FROM problems WHERE id = NEW.problem_id FOR UPDATE;
          NEW.performance_table_id := CASE WHEN EXISTS (
            SELECT 1 FROM sessions s WHERE s.problem_id = NEW.problem_id
              AND (s.date, s.order_index, s.id) < (NEW.date, NEW.order_index, NEW.id)
          ) THEN '34200000-0000-4000-8000-000000000001'::uuid
            ELSE '34200000-0000-4000-8000-000000000002'::uuid END;
          NEW.uses_default_table := TRUE;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM sessions s JOIN performance_tables pt
                     ON pt.id = s.performance_table_id WHERE pt.is_default = TRUE) THEN
          RAISE EXCEPTION 'Copie e desvincule as tabelas padrão do sistema antes de reverter esta migration.';
        END IF;
      END $$;
      ALTER TABLE performance_tables DROP CONSTRAINT ck_system_performance_table_owner;
      DELETE FROM performance_criteria WHERE performance_table_id IN (
        '34200000-0000-4000-8000-000000000001', '34200000-0000-4000-8000-000000000002');
      DELETE FROM performance_tables WHERE tutor_id IS NULL AND is_default = TRUE;
      ALTER TABLE performance_tables ALTER COLUMN tutor_id SET NOT NULL;
      UPDATE performance_tables SET is_default = TRUE
       WHERE id IN (SELECT id FROM system_default_table_migration_backup);
      DROP TABLE system_default_table_migration_backup;
      CREATE UNIQUE INDEX uq_performance_tables_tutor_default ON performance_tables(tutor_id)
        WHERE is_default = TRUE AND deleted_at IS NULL;
      ALTER TABLE sessions DROP COLUMN uses_default_table;
      CREATE OR REPLACE FUNCTION assign_session_performance_table() RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.performance_table_id IS NULL THEN
          SELECT COALESCE(
            (SELECT s.performance_table_id FROM sessions s JOIN performance_tables pt ON pt.id = s.performance_table_id
              WHERE s.problem_id = NEW.problem_id AND pt.deleted_at IS NULL ORDER BY s.order_index LIMIT 1),
            (SELECT pt.id FROM problems p JOIN rooms r ON r.id = p.room_id
              JOIN performance_tables pt ON pt.tutor_id = r.tutor_id
              WHERE p.id = NEW.problem_id AND pt.is_default = TRUE AND pt.deleted_at IS NULL LIMIT 1)
          ) INTO NEW.performance_table_id;
        END IF;
        IF NEW.performance_table_id IS NULL THEN
          RAISE EXCEPTION 'No active performance table is available for this session.';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }
}
