import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionPerformanceTableCopies1792100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE performance_tables
        ADD COLUMN source_table_id UUID,
        ADD COLUMN is_session_copy BOOLEAN NOT NULL DEFAULT FALSE,
        ADD CONSTRAINT fk_performance_tables_source
          FOREIGN KEY (source_table_id) REFERENCES performance_tables(id) ON DELETE SET NULL;
      CREATE INDEX idx_performance_tables_source ON performance_tables(source_table_id);
      ALTER TABLE performance_criteria
        ADD COLUMN source_criterion_id UUID REFERENCES performance_criteria(id) ON DELETE SET NULL;

      CREATE TEMP TABLE session_performance_table_copies ON COMMIT DROP AS
         SELECT table_groups.source_table_id,
          table_groups.problem_id,
          table_groups.room_id,
          gen_random_uuid() AS copied_table_id
        FROM (
          SELECT DISTINCT s.performance_table_id AS source_table_id,
              s.problem_id,
              p.room_id
            FROM sessions s
            JOIN problems p ON p.id = s.problem_id
            JOIN performance_tables pt ON pt.id = s.performance_table_id
           WHERE pt.is_session_copy = FALSE
        ) table_groups;

      INSERT INTO performance_tables
        (id, tutor_id, room_id, name, description, is_default, source_table_id, is_session_copy)
      SELECT copies.copied_table_id, source.tutor_id, copies.room_id,
             source.name, source.description, FALSE, source.id, TRUE
        FROM session_performance_table_copies copies
        JOIN performance_tables source ON source.id = copies.source_table_id;

      CREATE TEMP TABLE session_performance_criterion_copies ON COMMIT DROP AS
        SELECT copies.copied_table_id,
               criteria.id AS source_criterion_id,
               gen_random_uuid() AS copied_criterion_id
          FROM session_performance_table_copies copies
          JOIN performance_criteria criteria
            ON criteria.performance_table_id = copies.source_table_id;

      INSERT INTO performance_criteria
        (id, performance_table_id, name, description, order_index, weight,
         created_at, updated_at, deleted_at, source_criterion_id)
      SELECT criterion_copies.copied_criterion_id, criterion_copies.copied_table_id,
             criteria.name, criteria.description, criteria.order_index, criteria.weight,
             criteria.created_at, criteria.updated_at, criteria.deleted_at,
             criterion_copies.source_criterion_id
        FROM session_performance_criterion_copies criterion_copies
        JOIN performance_criteria criteria
          ON criteria.id = criterion_copies.source_criterion_id;

      UPDATE session_evaluation_criteria snapshot
         SET criterion_id = criterion_copies.copied_criterion_id
        FROM sessions s, session_performance_table_copies table_copies,
             session_performance_criterion_copies criterion_copies
       WHERE snapshot.session_id = s.id
         AND s.problem_id = table_copies.problem_id
         AND s.performance_table_id = table_copies.source_table_id
         AND criterion_copies.copied_table_id = table_copies.copied_table_id
         AND criterion_copies.source_criterion_id = snapshot.criterion_id;

        UPDATE criterion_grades grade
           SET criterion_id = criterion_copies.copied_criterion_id
          FROM sessions s, session_performance_table_copies table_copies,
           session_performance_criterion_copies criterion_copies
         WHERE grade.session_id = s.id
           AND s.problem_id = table_copies.problem_id
           AND s.performance_table_id = table_copies.source_table_id
           AND criterion_copies.copied_table_id = table_copies.copied_table_id
           AND criterion_copies.source_criterion_id = grade.criterion_id;

      UPDATE evaluation_items item
         SET criterion_id = criterion_copies.copied_criterion_id
        FROM evaluations evaluation, sessions s,
             session_performance_table_copies table_copies,
             session_performance_criterion_copies criterion_copies
       WHERE item.evaluation_id = evaluation.id
         AND evaluation.session_id = s.id
         AND s.problem_id = table_copies.problem_id
         AND s.performance_table_id = table_copies.source_table_id
         AND criterion_copies.copied_table_id = table_copies.copied_table_id
         AND criterion_copies.source_criterion_id = item.criterion_id;

      UPDATE session_evaluation_configs config
         SET performance_table_id = table_copies.copied_table_id
        FROM sessions s, session_performance_table_copies table_copies
       WHERE config.session_id = s.id
         AND s.problem_id = table_copies.problem_id
         AND s.performance_table_id = table_copies.source_table_id;

      UPDATE evaluations evaluation
         SET performance_table_id = table_copies.copied_table_id
        FROM sessions s, session_performance_table_copies table_copies
       WHERE evaluation.session_id = s.id
         AND s.problem_id = table_copies.problem_id
         AND s.performance_table_id = table_copies.source_table_id;

      UPDATE sessions s
         SET performance_table_id = table_copies.copied_table_id
        FROM session_performance_table_copies table_copies
       WHERE s.problem_id = table_copies.problem_id
         AND s.performance_table_id = table_copies.source_table_id;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE evaluation_items item
         SET criterion_id = criteria.source_criterion_id
        FROM performance_criteria criteria
       WHERE item.criterion_id = criteria.id
         AND criteria.source_criterion_id IS NOT NULL;
      UPDATE session_evaluation_criteria snapshot
         SET criterion_id = criteria.source_criterion_id
        FROM performance_criteria criteria
       WHERE snapshot.criterion_id = criteria.id
         AND criteria.source_criterion_id IS NOT NULL;
      UPDATE criterion_grades grade
         SET criterion_id = criteria.source_criterion_id
        FROM sessions s, performance_tables table_copy, performance_criteria criteria
       WHERE grade.session_id = s.id
         AND table_copy.id = s.performance_table_id
         AND criteria.id = grade.criterion_id
         AND criteria.performance_table_id = table_copy.id
         AND criteria.source_criterion_id IS NOT NULL;

      UPDATE evaluations evaluation
         SET performance_table_id = table_copy.source_table_id
        FROM performance_tables table_copy
       WHERE evaluation.performance_table_id = table_copy.id
         AND table_copy.is_session_copy = TRUE;
      UPDATE session_evaluation_configs config
         SET performance_table_id = table_copy.source_table_id
        FROM performance_tables table_copy
       WHERE config.performance_table_id = table_copy.id
         AND table_copy.is_session_copy = TRUE;
      UPDATE sessions session
         SET performance_table_id = table_copy.source_table_id
        FROM performance_tables table_copy
       WHERE session.performance_table_id = table_copy.id
         AND table_copy.is_session_copy = TRUE;

      DELETE FROM performance_criteria WHERE source_criterion_id IS NOT NULL;
      DELETE FROM performance_tables WHERE is_session_copy = TRUE;
      ALTER TABLE performance_criteria DROP COLUMN source_criterion_id;
      DROP INDEX idx_performance_tables_source;
      ALTER TABLE performance_tables
        DROP CONSTRAINT fk_performance_tables_source,
        DROP COLUMN source_table_id,
        DROP COLUMN is_session_copy;
    `);
  }
}
