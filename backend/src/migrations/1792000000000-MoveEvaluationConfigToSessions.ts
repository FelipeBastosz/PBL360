import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveEvaluationConfigToSessions1792000000000 implements MigrationInterface {
  name = 'MoveEvaluationConfigToSessions1792000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE move_evaluation_config_problem_table_backup AS
        SELECT id, performance_table_id FROM problems;
      CREATE TABLE move_evaluation_config_formula_backup AS
        SELECT * FROM formulas WHERE scope = 'SESSAO';
      CREATE TABLE move_evaluation_config_component_backup AS
        SELECT fc.* FROM formula_components fc
        JOIN formulas f ON f.id = fc.formula_id
        WHERE f.scope = 'SESSAO';

      ALTER TABLE sessions
        ADD COLUMN performance_table_id UUID;

      UPDATE sessions s
         SET performance_table_id = COALESCE(
           p.performance_table_id,
           (
             SELECT pt.id
               FROM performance_tables pt
               JOIN rooms r ON r.tutor_id = pt.tutor_id
              WHERE r.id = p.room_id
                AND pt.is_default = TRUE
                AND pt.deleted_at IS NULL
              LIMIT 1
           )
         )
        FROM problems p
       WHERE p.id = s.problem_id;

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM sessions WHERE performance_table_id IS NULL) THEN
          RAISE EXCEPTION 'Cannot move evaluation configuration: a session has no available performance table.';
        END IF;
      END $$;

      ALTER TABLE sessions
        ALTER COLUMN performance_table_id SET NOT NULL,
        ADD CONSTRAINT fk_sessions_performance_table
          FOREIGN KEY (performance_table_id)
          REFERENCES performance_tables(id)
          ON DELETE RESTRICT;
      CREATE INDEX idx_sessions_performance_table_id ON sessions(performance_table_id);

      ALTER TABLE formulas
        ADD COLUMN session_id UUID,
        ADD COLUMN legacy_formula_id UUID,
        ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE formulas
        ALTER COLUMN problem_id DROP NOT NULL;

      INSERT INTO formulas (problem_id, session_id, legacy_formula_id, scope, version, active, created_by, created_at)
      SELECT NULL, s.id, f.id, f.scope, f.version, f.active, f.created_by, f.created_at
        FROM formulas f
        JOIN sessions s ON s.problem_id = f.problem_id
       WHERE f.scope = 'SESSAO';

      INSERT INTO formula_components (formula_id, type, reference_id, weight)
      SELECT copied.id, categories.type, NULL, categories.weight
        FROM formulas copied
        JOIN LATERAL (
          SELECT 'CRITERIOS' AS type, COALESCE(SUM(old_components.weight), 100) AS weight
            FROM formula_components old_components
           WHERE old_components.formula_id = copied.legacy_formula_id
          UNION ALL
          SELECT 'PAPEL', 100 - COALESCE(SUM(old_components.weight), 100)
            FROM formula_components old_components
           WHERE old_components.formula_id = copied.legacy_formula_id
        ) categories ON TRUE
       WHERE copied.scope = 'SESSAO' AND copied.session_id IS NOT NULL;

      DELETE FROM formulas WHERE scope = 'SESSAO' AND problem_id IS NOT NULL;

      INSERT INTO formulas (problem_id, session_id, scope, version, active, is_default, created_by)
      SELECT NULL, s.id, 'SESSAO', 1, TRUE, TRUE, p.created_by
        FROM sessions s
        JOIN problems p ON p.id = s.problem_id
       WHERE NOT EXISTS (
         SELECT 1 FROM formulas f
          WHERE f.session_id = s.id AND f.scope = 'SESSAO' AND f.active = TRUE
       );

      INSERT INTO formula_components (formula_id, type, reference_id, weight)
      SELECT f.id, defaults.type, NULL, defaults.weight
        FROM formulas f
        CROSS JOIN (VALUES ('CRITERIOS', 70), ('PAPEL', 30)) AS defaults(type, weight)
       WHERE f.scope = 'SESSAO'
         AND f.session_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM formula_components fc WHERE fc.formula_id = f.id
         );

      ALTER TABLE formulas
        ADD CONSTRAINT fk_formulas_session
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        ADD CONSTRAINT ck_formulas_owner_scope CHECK (
          (scope = 'PROBLEMA' AND problem_id IS NOT NULL AND session_id IS NULL)
          OR (scope = 'SESSAO' AND problem_id IS NULL AND session_id IS NOT NULL)
        );
      CREATE INDEX idx_formulas_session_scope ON formulas(session_id, scope);
      CREATE UNIQUE INDEX uq_formulas_active_session
        ON formulas(session_id) WHERE scope = 'SESSAO' AND active = TRUE;
      ALTER TABLE formulas DROP COLUMN legacy_formula_id;

      DROP INDEX IF EXISTS idx_problems_performance_table_id;
      ALTER TABLE problems
        DROP CONSTRAINT IF EXISTS fk_problems_performance_table,
        DROP COLUMN IF EXISTS performance_table_id;

      CREATE FUNCTION assign_session_performance_table() RETURNS TRIGGER AS $$
      DECLARE
        initial_table_id UUID;
      BEGIN
        IF NEW.performance_table_id IS NULL THEN
          SELECT COALESCE(
            (SELECT s.performance_table_id
               FROM sessions s
               JOIN performance_tables existing ON existing.id = s.performance_table_id
              WHERE s.problem_id = NEW.problem_id AND existing.deleted_at IS NULL
              ORDER BY s.order_index LIMIT 1),
            (SELECT pt.id
               FROM problems p
               JOIN rooms r ON r.id = p.room_id
               JOIN performance_tables pt ON pt.tutor_id = r.tutor_id
              WHERE p.id = NEW.problem_id AND pt.is_default = TRUE AND pt.deleted_at IS NULL
              LIMIT 1)
          ) INTO initial_table_id;
          NEW.performance_table_id := initial_table_id;
        END IF;
        IF NEW.performance_table_id IS NULL THEN
          RAISE EXCEPTION 'No active performance table is available for this session.';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_assign_session_performance_table
        BEFORE INSERT ON sessions
        FOR EACH ROW EXECUTE FUNCTION assign_session_performance_table();

      CREATE FUNCTION create_session_default_formula() RETURNS TRIGGER AS $$
      DECLARE
        problem_creator_id UUID;
        default_formula_id UUID;
      BEGIN
        SELECT created_by INTO problem_creator_id
          FROM problems WHERE id = NEW.problem_id;
        INSERT INTO formulas (session_id, scope, version, active, is_default, created_by)
        VALUES (NEW.id, 'SESSAO', 1, TRUE, TRUE, problem_creator_id)
        RETURNING id INTO default_formula_id;
        INSERT INTO formula_components (formula_id, type, weight)
        VALUES (default_formula_id, 'CRITERIOS', 70), (default_formula_id, 'PAPEL', 30);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_create_session_default_formula
        AFTER INSERT ON sessions
        FOR EACH ROW EXECUTE FUNCTION create_session_default_formula();
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_create_session_default_formula ON sessions;
      DROP TRIGGER IF EXISTS trg_assign_session_performance_table ON sessions;
      DROP FUNCTION IF EXISTS create_session_default_formula();
      DROP FUNCTION IF EXISTS assign_session_performance_table();

      DROP INDEX IF EXISTS uq_formulas_active_session;
      DROP INDEX IF EXISTS idx_formulas_session_scope;
      ALTER TABLE formulas
        DROP CONSTRAINT IF EXISTS ck_formulas_owner_scope,
        DROP CONSTRAINT IF EXISTS fk_formulas_session;

      DELETE FROM formulas WHERE scope = 'SESSAO' AND session_id IS NOT NULL;
      ALTER TABLE formulas
        ALTER COLUMN problem_id SET NOT NULL,
        DROP COLUMN session_id,
        DROP COLUMN is_default;
      INSERT INTO formulas (id, problem_id, scope, version, active, created_by, created_at)
      SELECT id, problem_id, scope, version, active, created_by, created_at
        FROM move_evaluation_config_formula_backup;
      INSERT INTO formula_components (id, formula_id, type, reference_id, weight)
      SELECT id, formula_id, type, reference_id, weight
        FROM move_evaluation_config_component_backup;
      ALTER TABLE problems
        ADD COLUMN IF NOT EXISTS performance_table_id UUID;
      UPDATE problems p
         SET performance_table_id = b.performance_table_id
        FROM move_evaluation_config_problem_table_backup b
       WHERE b.id = p.id;
      ALTER TABLE problems
        DROP CONSTRAINT IF EXISTS fk_problems_performance_table;
      DROP INDEX IF EXISTS idx_problems_performance_table_id;
      ALTER TABLE problems
        ADD CONSTRAINT fk_problems_performance_table
          FOREIGN KEY (performance_table_id)
          REFERENCES performance_tables(id)
          ON DELETE RESTRICT;
      CREATE INDEX IF NOT EXISTS idx_problems_performance_table_id
        ON problems(performance_table_id);

      DROP INDEX IF EXISTS idx_sessions_performance_table_id;
      ALTER TABLE sessions
        DROP CONSTRAINT IF EXISTS fk_sessions_performance_table,
        DROP COLUMN IF EXISTS performance_table_id;

      DROP TABLE move_evaluation_config_component_backup;
      DROP TABLE move_evaluation_config_formula_backup;
      DROP TABLE move_evaluation_config_problem_table_backup;
    `);
  }
}
