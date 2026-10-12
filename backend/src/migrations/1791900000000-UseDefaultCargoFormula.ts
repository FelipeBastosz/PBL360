import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UseDefaultCargoFormula1791900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluations DROP CONSTRAINT ck_evaluation_submission;
      ALTER TABLE evaluations ADD CONSTRAINT ck_evaluation_submission CHECK (
        (status = 'DRAFT' AND submitted_at IS NULL AND session_score IS NULL AND applied_bonus IS NULL)
        OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND
          (type <> 'TUTOR_SESSION' OR (session_score IS NOT NULL AND calculation_version IS NOT NULL)))
      );

      UPDATE evaluations e
         SET applied_bonus = NULL
       WHERE e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED' AND e.applied_bonus = 0
         AND NOT EXISTS (
           SELECT 1 FROM session_roles sr
            WHERE sr.session_id = e.session_id AND sr.student_id = e.student_id
              AND sr.bonus_score IS NOT NULL
         );

      UPDATE performance_criteria pc
         SET weight = CASE pc.name
           WHEN 'Seguimento' THEN 4
           WHEN 'Participação' THEN 4
           WHEN 'Comportamento' THEN 2
         END
        FROM performance_tables pt
       WHERE pc.performance_table_id = pt.id
         AND pt.is_default = TRUE
         AND pc.deleted_at IS NULL
         AND pc.name IN ('Seguimento', 'Participação', 'Comportamento');

      UPDATE session_evaluation_criteria sec
         SET weight = CASE sec.name
           WHEN 'Seguimento' THEN 4
           WHEN 'Participação' THEN 4
           WHEN 'Comportamento' THEN 2
         END
        FROM session_evaluation_configs cfg
        JOIN performance_tables pt ON pt.id = cfg.performance_table_id
       WHERE sec.session_id = cfg.session_id
         AND pt.is_default = TRUE
         AND sec.name IN ('Seguimento', 'Participação', 'Comportamento');

      WITH weighted_scores AS (
        SELECT e.id,
               SUM(COALESCE(ei.score, 0) * sec.weight) / NULLIF(SUM(sec.weight), 0) AS simple_score
          FROM evaluations e
          JOIN session_evaluation_criteria sec ON sec.session_id = e.session_id
          LEFT JOIN evaluation_items ei
            ON ei.evaluation_id = e.id AND ei.criterion_id = sec.criterion_id
         WHERE e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
         GROUP BY e.id
      )
      UPDATE evaluations e
         SET session_score = ROUND(
               CASE WHEN e.applied_bonus IS NULL THEN weighted_scores.simple_score
                    ELSE (weighted_scores.simple_score * 7 + e.applied_bonus * 10 * 3) / 10
               END,
               2
             ),
             calculation_version = 'WEIGHTED_CRITERIA_CARGO_70_30_V2'
        FROM weighted_scores
       WHERE e.id = weighted_scores.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE evaluations
         SET applied_bonus = 0
       WHERE type = 'TUTOR_SESSION' AND status = 'SUBMITTED' AND applied_bonus IS NULL;

      ALTER TABLE evaluations DROP CONSTRAINT ck_evaluation_submission;
      ALTER TABLE evaluations ADD CONSTRAINT ck_evaluation_submission CHECK (
        (status = 'DRAFT' AND submitted_at IS NULL AND session_score IS NULL AND applied_bonus IS NULL)
        OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND
          (type <> 'TUTOR_SESSION' OR
            (session_score IS NOT NULL AND applied_bonus IS NOT NULL AND calculation_version IS NOT NULL)))
      );

      UPDATE performance_criteria pc
         SET weight = CASE pc.name
           WHEN 'Seguimento' THEN 3
           WHEN 'Participação' THEN 4
           WHEN 'Comportamento' THEN 3
         END
        FROM performance_tables pt
       WHERE pc.performance_table_id = pt.id
         AND pt.is_default = TRUE
         AND pc.deleted_at IS NULL
         AND pc.name IN ('Seguimento', 'Participação', 'Comportamento');

      UPDATE session_evaluation_criteria sec
         SET weight = CASE sec.name
           WHEN 'Seguimento' THEN 3
           WHEN 'Participação' THEN 4
           WHEN 'Comportamento' THEN 3
         END
        FROM session_evaluation_configs cfg
        JOIN performance_tables pt ON pt.id = cfg.performance_table_id
       WHERE sec.session_id = cfg.session_id
         AND pt.is_default = TRUE
         AND sec.name IN ('Seguimento', 'Participação', 'Comportamento');

      WITH weighted_scores AS (
        SELECT e.id,
               SUM(COALESCE(ei.score, 0) * sec.weight) / NULLIF(SUM(sec.weight), 0) AS simple_score
          FROM evaluations e
          JOIN session_evaluation_criteria sec ON sec.session_id = e.session_id
          LEFT JOIN evaluation_items ei
            ON ei.evaluation_id = e.id AND ei.criterion_id = sec.criterion_id
         WHERE e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
         GROUP BY e.id
      )
      UPDATE evaluations e
         SET session_score = ROUND(weighted_scores.simple_score + COALESCE(e.applied_bonus, 0), 2),
             calculation_version = 'WEIGHTED_AVERAGE_BONUS_V1'
        FROM weighted_scores
       WHERE e.id = weighted_scores.id;
    `);
  }
}
