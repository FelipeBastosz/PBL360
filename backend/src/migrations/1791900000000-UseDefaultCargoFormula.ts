import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UseDefaultCargoFormula1791900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
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
               (weighted_scores.simple_score * 7 + COALESCE(e.applied_bonus, 0) * 10 * 3) / 10,
               2
             ),
             calculation_version = 'WEIGHTED_CRITERIA_CARGO_70_30_V2'
        FROM weighted_scores
       WHERE e.id = weighted_scores.id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
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
