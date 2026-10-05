import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateObservations1791230359206 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE observations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        author_id UUID NOT NULL,
        text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT fk_observations_session
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_observations_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_observations_author
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_observations_session_student ON observations(session_id, student_id);

      CREATE TABLE observation_tags (
        observation_id UUID NOT NULL,
        tag_id UUID NOT NULL,

        CONSTRAINT pk_observation_tags PRIMARY KEY (observation_id, tag_id),
        CONSTRAINT fk_observation_tags_observation
          FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE,
        CONSTRAINT fk_observation_tags_tag
          FOREIGN KEY (tag_id) REFERENCES behavior_tags(id) ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS observation_tags;');
    await queryRunner.query('DROP TABLE IF EXISTS observations;');
  }
}
