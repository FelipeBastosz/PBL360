import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfessorFormulaScope1792800000000 implements MigrationInterface {
  name = 'AddProfessorFormulaScope1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE formulas DROP CONSTRAINT IF EXISTS ck_formulas_owner_scope;
      ALTER TABLE formulas ADD CONSTRAINT ck_formulas_owner_scope CHECK (
        (scope = 'PROBLEMA' AND problem_id IS NOT NULL AND session_id IS NULL)
        OR (scope = 'SESSAO' AND problem_id IS NULL AND session_id IS NOT NULL)
        OR (scope = 'PROFESSOR' AND problem_id IS NULL AND session_id IS NULL)
      );

      CREATE INDEX IF NOT EXISTS idx_formulas_professor_scope
        ON formulas (created_by, scope);

      CREATE UNIQUE INDEX IF NOT EXISTS uq_formulas_active_professor
        ON formulas (created_by)
        WHERE scope = 'PROFESSOR' AND active = TRUE;

      CREATE OR REPLACE FUNCTION create_session_default_formula() RETURNS TRIGGER AS $$
      DECLARE
        tutor_user_id UUID;
        default_formula_id UUID;
        prof_formula_id UUID;
      BEGIN
        SELECT COALESCE(r.tutor_id, p.created_by) INTO tutor_user_id
          FROM problems p
          LEFT JOIN rooms r ON r.id = p.room_id
         WHERE p.id = NEW.problem_id;

        INSERT INTO formulas (session_id, scope, version, active, is_default, created_by)
        VALUES (NEW.id, 'SESSAO', 1, TRUE, TRUE, tutor_user_id)
        RETURNING id INTO default_formula_id;

        SELECT id INTO prof_formula_id
          FROM formulas
         WHERE created_by = tutor_user_id
           AND scope = 'PROFESSOR'
           AND active = TRUE
         LIMIT 1;

        IF prof_formula_id IS NOT NULL THEN
          INSERT INTO formula_components (formula_id, type, reference_id, weight)
          SELECT default_formula_id, type, reference_id, weight
            FROM formula_components
           WHERE formula_id = prof_formula_id;
        ELSE
          INSERT INTO formula_components (formula_id, type, weight)
          VALUES (default_formula_id, 'CRITERIOS', 70), (default_formula_id, 'PAPEL', 30);
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION create_session_default_formula() RETURNS TRIGGER AS $$
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

      DROP INDEX IF EXISTS uq_formulas_active_professor;
      DROP INDEX IF EXISTS idx_formulas_professor_scope;
      DELETE FROM formulas WHERE scope = 'PROFESSOR';

      ALTER TABLE formulas DROP CONSTRAINT IF EXISTS ck_formulas_owner_scope;
      ALTER TABLE formulas ADD CONSTRAINT ck_formulas_owner_scope CHECK (
        (scope = 'PROBLEMA' AND problem_id IS NOT NULL AND session_id IS NULL)
        OR (scope = 'SESSAO' AND problem_id IS NULL AND session_id IS NOT NULL)
      );
    `);
  }
}
